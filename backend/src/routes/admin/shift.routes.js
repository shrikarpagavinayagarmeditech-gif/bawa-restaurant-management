import express from "express";

import {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
} from "../../controllers/admin/shift.controller.js";

import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

router.post("/", createShift);

router.get("/", getShifts);

router.get("/:id", getShiftById);

router.put("/:id", updateShift);

router.delete("/:id", deleteShift);

export default router;