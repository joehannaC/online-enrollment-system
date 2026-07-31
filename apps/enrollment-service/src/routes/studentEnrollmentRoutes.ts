import {
    Router,
} from "express";

import {
    handleAddDraftItem,
    handleGetStudentEnrollment,
    handleRemoveDraftItem,
    handleSubmitEnrollment,
} from "../controllers/studentEnrollmentController.js";
import {
    authenticate,
} from "../middleware/authenticate.js";

const studentEnrollmentRouter =
    Router();

studentEnrollmentRouter.get(
    "/enrollment",
    authenticate,
    handleGetStudentEnrollment,
);

studentEnrollmentRouter.post(
    "/enrollment/draft/items",
    authenticate,
    handleAddDraftItem,
);

studentEnrollmentRouter.delete(
    "/enrollment/draft/items/:itemId",
    authenticate,
    handleRemoveDraftItem,
);

studentEnrollmentRouter.post(
    "/enrollment/submit",
    authenticate,
    handleSubmitEnrollment,
);

export default studentEnrollmentRouter;