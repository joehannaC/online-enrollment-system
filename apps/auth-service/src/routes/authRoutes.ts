import { Router } from "express";

import { loginController } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/login", loginController);