import express from "express";

import {
  createDraftOrder,
  getDraftOrders,
  getOrders,
  getOrderById,
  updateDraftOrder,
  completeDraftOrder,
  cancelDraftOrder,
} from "../../controllers/branch/order.controller.js";

import {
  authMiddleware,
  branchOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

// All order APIs require logged-in branch user
router.use(authMiddleware);
router.use(branchOnly);

// Create new draft bill
router.post(
  "/draft",
  createDraftOrder
);

// Get current branch draft bills
router.get(
  "/drafts",
  getDraftOrders
);

// Get all branch orders
router.get(
  "/",
  getOrders
);

// Get one bill
router.get(
  "/:id",
  getOrderById
);

// Update existing draft
router.put(
  "/:id/draft",
  updateDraftOrder
);

// Complete draft
router.post(
  "/:id/complete",
  completeDraftOrder
);

// Cancel draft
router.delete(
  "/:id/draft",
  cancelDraftOrder
);

export default router;