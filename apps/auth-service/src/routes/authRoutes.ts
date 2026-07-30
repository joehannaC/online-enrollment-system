import { Router } from "express";

import { loginController } from "../controllers/authController.js";
import { changePasswordController } from "../controllers/changePasswordController.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRoutes = Router();

authRoutes.post("/login", loginController);
authRoutes.patch(
    "/change-password",
    authenticate,
    changePasswordController,
);