import express from "express";

import {
    createFoodItem,
    getFoodItems,
    getFoodItemById,
    updateFoodItem,
    deleteFoodItem,
} from "../../controllers/admin/foodItem.controller.js";

import {
    authMiddleware,
    adminOnly,
} from "../../middleware/auth.middleware.js";

import uploadFoodImage from "../../middleware/upload.middleware.js";


const router = express.Router();


// =========================================
// AUTH
// =========================================

router.use(authMiddleware);

router.use(adminOnly);


// =========================================
// CREATE
// =========================================

router.post(
    "/",
    uploadFoodImage.single("image"),
    createFoodItem
);


// =========================================
// GET ALL
// =========================================

router.get(
    "/",
    getFoodItems
);


// =========================================
// GET BY ID
// =========================================

router.get(
    "/:id",
    getFoodItemById
);


// =========================================
// UPDATE
// =========================================

router.put(
    "/:id",
    uploadFoodImage.single("image"),
    updateFoodItem
);


// =========================================
// DELETE
// =========================================

router.delete(
    "/:id",
    deleteFoodItem
);


export default router;