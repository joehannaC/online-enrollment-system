import {
    Router,
} from "express";

import {
    getMyProfileController,
} from "../controllers/profileController.js";
import {
    authenticate,
} from "../middleware/authenticate.js";

const profileRouter =
    Router();

profileRouter.get(
    "/me",
    authenticate,
    getMyProfileController,
);

export default profileRouter;