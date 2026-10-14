import express from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../../controllers/admin/category.controller.js";

import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

router.post("/", createCategory);

router.get("/", getCategories);

router.get("/:id", getCategoryById);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

export default router;