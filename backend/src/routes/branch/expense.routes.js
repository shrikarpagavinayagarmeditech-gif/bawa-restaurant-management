import express from "express";

import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../../controllers/admin/expense.controller.js";

import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;