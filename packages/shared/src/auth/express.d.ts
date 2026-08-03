import type { AccessTokenClaims } from "./types.js";

declare global {
    namespace Express {
        interface Request {
            authUser?: AccessTokenClaims;
        }
    }
}

export {};
