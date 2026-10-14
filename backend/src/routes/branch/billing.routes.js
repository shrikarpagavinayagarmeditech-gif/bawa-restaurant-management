import express from "express";

import {
  holdBill,
  getHeldBills,
  getDraftBill,
  updateDraftBill,
  completeBill,
  cancelBill,
  getTodaySummary,
} from "../../controllers/branch/billing.controller.js";

import {
  authMiddleware,
  branchOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

// All billing APIs require authentication + branch role
router.use(authMiddleware);
router.use(branchOnly);

// Today's billing summary
router.get("/today-summary", getTodaySummary);

// Hold / Draft bills
router.post("/hold", holdBill);

router.get("/holds", getHeldBills);

router.get("/draft/:id", getDraftBill);

router.put("/draft/:id", updateDraftBill);

// Complete bill
router.post("/complete/:id", completeBill);

// Cancel bill
router.post("/cancel/:id", cancelBill);

export default router;