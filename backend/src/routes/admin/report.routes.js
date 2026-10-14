import express from "express";

import {
  getDashboardSummary,
  getFoodWiseReport,
  getShiftWiseReport,
  getDayWiseReport,
  getCustomDateReport,
  getGstWiseReport,
  getBranchWiseReport,
  getBranchComparisonReport,
} from "../../controllers/admin/report.controller.js";
import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);


// Dashboard
router.get(
  "/dashboard-summary",
  getDashboardSummary
);


// Food-wise
router.get(
  "/food-wise",
  getFoodWiseReport
);


// Shift-wise
router.get(
  "/shift-wise",
  getShiftWiseReport
);


// Day-wise
router.get(
  "/day-wise",
  getDayWiseReport
);


// Custom date
router.get(
  "/custom-date",
  getCustomDateReport
);

// GST-wise
router.get(
  "/gst-wise",
  getGstWiseReport
);

router.get("/branch-wise", getBranchWiseReport);

router.get("/branch-comparison", getBranchComparisonReport);

export default router;