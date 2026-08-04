import type {
    Socket,
} from "node:net";

import {
    Router,
    type Request,
    type Response,
} from "express";

import {
    createProxyMiddleware,
} from "http-proxy-middleware";

import {
    env,
} from "../config/env.js";

export const proxyRoutes =
    Router();

function isHttpResponse(
    response: Response | Socket,
): response is Response {
    return (
        "setHeader" in response &&
        "end" in response &&
        "headersSent" in response
    );
}

function proxy(
    target: string,
    serviceName: string,
) {
    console.log(
        `[api-gateway] ${serviceName} target: ${target}`,
    );

    return createProxyMiddleware<
        Request,
        Response
    >({
        target,
        changeOrigin: true,
        xfwd: true,

        proxyTimeout:
            env.PROXY_TIMEOUT_MS,

        timeout:
            env.PROXY_TIMEOUT_MS,

        pathRewrite(
            _path,
            request,
        ) {
            return request.originalUrl;
        },

        on: {
            proxyReq(
                proxyRequest,
                request,
            ) {
                const authorization =
                    request.headers
                        .authorization;

                if (authorization) {
                    proxyRequest.setHeader(
                        "authorization",
                        authorization,
                    );
                }

                console.log(
                    `[api-gateway] ${serviceName} request`,
                    {
                        method:
                            request.method,

                        originalUrl:
                            request.originalUrl,

                        forwardedPath:
                            request.originalUrl,

                        target,

                        authorization:
                            authorization
                                ? "received"
                                : "missing",
                    },
                );
            },

            proxyRes(
                proxyResponse,
                request,
            ) {
                console.log(
                    `[api-gateway] ${serviceName} response`,
                    {
                        method:
                            request.method,

                        originalUrl:
                            request.originalUrl,

                        status:
                            proxyResponse
                                .statusCode,

                        target,
                    },
                );

                delete proxyResponse.headers[
                    "access-control-allow-origin"
                ];

                delete proxyResponse.headers[
                    "access-control-allow-credentials"
                ];

                delete proxyResponse.headers[
                    "access-control-allow-methods"
                ];

                delete proxyResponse.headers[
                    "access-control-allow-headers"
                ];

                delete proxyResponse.headers[
                    "access-control-expose-headers"
                ];

                delete proxyResponse.headers[
                    "access-control-max-age"
                ];
            },

            error(
                error,
                request,
                response,
            ) {
                console.error(
                    `[api-gateway] ${serviceName} proxy error`,
                    {
                        method:
                            request.method,

                        url:
                            request.originalUrl,

                        target,

                        message:
                            error.message,
                    },
                );

                if (
                    !isHttpResponse(
                        response,
                    )
                ) {
                    if (
                        !response.destroyed
                    ) {
                        response.end();
                    }

                    return;
                }

                if (
                    response.headersSent
                ) {
                    response.end();

                    return;
                }

                response.status(
                    503,
                );

                response.json({
                    success: false,

                    error: {
                        code:
                            "UPSTREAM_SERVICE_UNAVAILABLE",

                        message:
                            `The ${serviceName} is unavailable.`,

                        service:
                            "api-gateway",
                    },
                });
            },
        },
    });
}

proxyRoutes.use(
    "/api/auth",
    proxy(
        env.AUTH_SERVICE_URL,
        "Authentication Service",
    ),
);

proxyRoutes.use(
    "/api/students/grades",
    proxy(
        env.GRADE_SERVICE_URL,
        "Grade Service",
    ),
);

proxyRoutes.use(
    "/api/faculty",
    proxy(
        env.GRADE_SERVICE_URL,
        "Grade Service",
    ),
);

proxyRoutes.use(
    "/api/profiles",
    proxy(
        env.PROFILE_SERVICE_URL,
        "Profile Service",
    ),
);

proxyRoutes.use(
    "/api/students",
    proxy(
        env.ENROLLMENT_SERVICE_URL,
        "Enrollment Service",
    ),
);