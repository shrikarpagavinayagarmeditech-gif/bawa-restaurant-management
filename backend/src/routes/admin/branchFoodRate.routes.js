import express from "express";

import {
  setBranchFoodRate,
  getBranchFoodRates,
  deleteBranchFoodRate,
} from "../../controllers/admin/branchFoodRate.controller.js";

import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

router.post("/", setBranchFoodRate);

router.get("/:branchId", getBranchFoodRates);

router.delete("/:branchId/:foodItemId", deleteBranchFoodRate);

export default router;