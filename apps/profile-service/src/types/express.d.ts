declare module "express-serve-static-core" {
    interface Request {
        auth?: {
            userId: string;
            role:
                | "STUDENT"
                | "FACULTY";
            email?: string;
        };
    }
}

export {};