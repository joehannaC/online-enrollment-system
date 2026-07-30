import { Router } from "express";

import { getStudentDashboardController } from "../controllers/studentDashboardController.js";
import {
    authenticate,
    requireStudent,
} from "../middleware/authenticate.js";

const studentRouter = Router();

studentRouter.use(
    authenticate,
    requireStudent,
);

studentRouter.get(
    "/dashboard",
    getStudentDashboardController,
);

export default studentRouter;