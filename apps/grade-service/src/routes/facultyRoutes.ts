import { Router } from "express";

import { getFacultyDashboardController } from "../controllers/facultyDashboardController.js";
import {
    authenticate,
    requireFaculty,
} from "../middleware/authenticate.js";

const facultyRouter = Router();

facultyRouter.use(
    authenticate,
    requireFaculty,
);

facultyRouter.get(
    "/dashboard",
    getFacultyDashboardController,
);

export default facultyRouter;