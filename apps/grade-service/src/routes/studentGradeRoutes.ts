import {
    Router,
} from "express";

import {
    handleGetStudentGrades,
} from "../controllers/studentGradeController.js";
import {
    authenticate,
} from "../middleware/authenticate.js";

const studentGradeRouter =
    Router();

studentGradeRouter.get(
    "/grades",
    authenticate,
    handleGetStudentGrades,
);

export default studentGradeRouter;