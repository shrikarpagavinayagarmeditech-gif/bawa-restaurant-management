import express from "express";

import {
  getOrders,
  getOrderById,
} from "../../controllers/admin/order.controller.js";

import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

router.get("/", getOrders);
router.get("/:id", getOrderById);

export default router;