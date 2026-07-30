import { Router } from "express";

import { getStudentDashboardController } from "../controllers/studentDashboardController.js";
import { getStudentProfileController } from "../controllers/studentProfileController.js";
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

studentRouter.get(
    "/profile",
    getStudentProfileController,
);

export default studentRouter;