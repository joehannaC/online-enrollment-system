import { Router } from "express";

import { getFacultyDashboardController } from "../controllers/facultyDashboardController.js";
import {
    authenticate,
    requireFaculty,
} from "../middleware/authenticate.js";

const facultyRouter = Router();

facultyRouter.get(
    "/dashboard",
    authenticate,
    requireFaculty,
    getFacultyDashboardController,
);

export default facultyRouter;