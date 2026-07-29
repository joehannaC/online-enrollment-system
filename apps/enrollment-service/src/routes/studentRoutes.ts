import { Router } from "express";

import { getStudentDashboardController } from "../controllers/studentDashboardController.js";
import {
    authenticate,
    requireStudent,
} from "../middleware/authenticate.js";

const studentRouter = Router();

studentRouter.get(
    "/dashboard",
    authenticate,
    requireStudent,
    getStudentDashboardController,
);

export default studentRouter;