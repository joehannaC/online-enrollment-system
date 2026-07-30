declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                role: "STUDENT" | "FACULTY";
                email?: string;
            };
        }
    }
}

export {};