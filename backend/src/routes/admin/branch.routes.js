import express from "express";

import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../../controllers/admin/branch.controller.js";

import {
  authMiddleware,
  adminOnly,
} from "../../middleware/auth.middleware.js";

const router = express.Router();

// All branch APIs require login + ADMIN role
router.use(authMiddleware);
router.use(adminOnly);

// Create branch
router.post("/", createBranch);

// Get all branches
router.get("/", getBranches);

// Get branch by ID
router.get("/:id", getBranchById);

// Update branch
router.put("/:id", updateBranch);

// Deactivate branch
router.delete("/:id", deleteBranch);

export default router;