export class AuthError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(
        message: string,
        statusCode = 401,
        code = "AUTHENTICATION_FAILED",
    ) {
        super(message);

        this.name = "AuthError";
        this.statusCode = statusCode;
        this.code = code;
    }
}