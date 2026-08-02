import {
    Router,
    type Request,
    type Response,
} from "express";
import {
    createProxyMiddleware,
} from "http-proxy-middleware";

import { env } from "../config/env.js";

export const proxyRoutes = Router();

function proxy(
    target: string,
    serviceName: string,
) {
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
            proxyRes(proxyResponse) {
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
                _request,
                response,
            ) {
                console.error(
                    `[api-gateway] ${serviceName} proxy error`,
                    error,
                );

                if (
                    response.headersSent
                ) {
                    return;
                }

                response.statusCode = 503;

                response.setHeader(
                    "Content-Type",
                    "application/json",
                );

                response.end(
                    JSON.stringify({
                        success: false,
                        error: {
                            code:
                                "UPSTREAM_SERVICE_UNAVAILABLE",
                            message:
                                `The ${serviceName} is unavailable.`,
                            service:
                                "api-gateway",
                        },
                    }),
                );
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