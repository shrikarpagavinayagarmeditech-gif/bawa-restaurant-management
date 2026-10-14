import express from "express";

import {
    getBranchMenu,
} from "../../controllers/branch/branchMenu.controller.js";

import {
    authMiddleware,
    branchOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(branchOnly);

router.get("/", getBranchMenu);

export default router;