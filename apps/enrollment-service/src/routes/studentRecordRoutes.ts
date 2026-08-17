import {
    Router,
} from "express";

import {
    handleGetStudentRecords,
} from "../controllers/studentRecordController.js";
import {
    authenticate,
} from "../middleware/authenticate.js";

const studentRecordRouter = Router();

studentRecordRouter.get(
    "/records",
    authenticate,
    handleGetStudentRecords,
);

export default studentRecordRouter;