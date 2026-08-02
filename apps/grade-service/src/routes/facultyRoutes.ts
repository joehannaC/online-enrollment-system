import { Router } from "express";

import {
    getFacultyDashboardController,
} from "../controllers/facultyDashboardController.js";
import {
    getFacultyGradeEntryController,
    saveFacultyGradeDraftController,
    submitFacultyGradesController,
} from "../controllers/facultyGradeEntryController.js";
import {
    getFacultyRecordsController,
} from "../controllers/facultyRecordController.js";
import {
    getFacultySubjectsController,
} from "../controllers/facultySubjectController.js";
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

facultyRouter.get(
    "/subjects",
    getFacultySubjectsController,
);

facultyRouter.get(
    "/grade-entry",
    getFacultyGradeEntryController,
);

facultyRouter.put(
    "/grade-entry/draft",
    saveFacultyGradeDraftController,
);

facultyRouter.post(
    "/grade-entry/submit",
    submitFacultyGradesController,
);

facultyRouter.get(
    "/records",
    getFacultyRecordsController,
);

export default facultyRouter;