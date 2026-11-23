
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =========================================
// CREATE FOOD ITEM
// New item is appended to the end of category
// =========================================

export const createFoodItem = async (req, res) => {
  try {
    console.log("=================================");
    console.log("🍴 CREATE FOOD ITEM");
    console.log("=================================");
    console.log("📦 Request Body:", req.body);
    console.log("🖼️ Uploaded File:", req.file);

    const { categoryId, name, rate, description } = req.body;

    if (!categoryId || !name || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category, food name and rate are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Food image is required",
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!category.active) {
      return res.status(400).json({
        success: false,
        message: "Cannot add food to an inactive category",
      });
    }

    const numericRate = Number(rate);

    if (!Number.isFinite(numericRate) || numericRate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a valid positive number",
      });
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Food name cannot be empty",
      });
    }

    const existingFoodItem = await prisma.foodItem.findFirst({
      where: {
        name: { equals: trimmedName },
        categoryId,
      },
    });

    if (existingFoodItem) {
      return res.status(409).json({
        success: false,
        message: "Food item already exists in this category",
      });
    }

    const imagePath = `/uploads/food-items/${req.file.filename}`;

    console.log("🖼️ Image Path:", imagePath);

    // Find the highest existing order in this category.
    // Existing items with sortOrder 0 remain before new items.
    const lastItem = await prisma.foodItem.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });

    const nextSortOrder = (lastItem._max.sortOrder ?? 0) + 1;

    const foodItem = await prisma.foodItem.create({
      data: {
        image: imagePath,
        categoryId,
        name: trimmedName,
        rate: numericRate,
        description: description?.trim() || null,
        active: true,
        sortOrder: nextSortOrder,
      },
      include: {
        category: true,
      },
    });

    console.log("✅ Food Item Created:", foodItem);

    return res.status(201).json({
      success: true,
      message: "Food item created successfully",
      data: foodItem,
    });
  } catch (error) {
    console.error("❌ Create food item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create food item",
    });
  }
};

// =========================================
// GET ALL FOOD ITEMS
// Category alphabetical, then manual order
// =========================================

export const getFoodItems = async (req, res) => {
  try {
    console.log("Fetching food items...");

    const foodItems = await prisma.foodItem.findMany({
      include: {
        category: true,
        branchFoodRates: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: [
        { category: { name: "asc" } },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    console.log("Food items fetched:", foodItems.length);

    return res.status(200).json({
      success: true,
      data: foodItems,
    });
  } catch (error) {
    console.error("FOOD ITEMS PRISMA ERROR:", error);
    console.error("ERROR CODE:", error.code);
    console.error("ERROR MESSAGE:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch food items",
      error: error.message,
      code: error.code || null,
    });
  }
};

// =========================================
// REORDER FOOD ITEMS
// All items in the selected category must be
// submitted, including inactive items.
// =========================================

export const reorderFoodItems = async (req, res) => {
  try {
    const { categoryId, itemIds } = req.body;

    console.log("=================================");
    console.log("🔃 REORDER FOOD ITEMS");
    console.log("Category ID:", categoryId);
    console.log("Item IDs:", itemIds);
    console.log("=================================");

    if (!categoryId || !Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        message: "Category ID and item IDs are required",
      });
    }

    if (itemIds.some((id) => typeof id !== "string" || !id.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid food item ID",
      });
    }

    if (new Set(itemIds).size !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate food item IDs are not allowed",
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Fetch every food item in this category.
    // This prevents accidentally omitting inactive items.
    const categoryItems = await prisma.foodItem.findMany({
      where: { categoryId },
      select: { id: true },
    });

    const existingIds = new Set(categoryItems.map((item) => item.id));
    const submittedIds = new Set(itemIds);

    const allItemsIncluded =
      categoryItems.length === itemIds.length &&
      categoryItems.every((item) => submittedIds.has(item.id));

    const allItemsBelongToCategory =
      itemIds.every((id) => existingIds.has(id));

    if (!allItemsIncluded || !allItemsBelongToCategory) {
      return res.status(400).json({
        success: false,
        message:
          "The submitted list must contain every food item in this category exactly once",
      });
    }

    // Save the order as 1, 2, 3, ...
    if (itemIds.length > 0) {
      await prisma.$transaction(
        itemIds.map((id, index) =>
          prisma.foodItem.update({
            where: { id },
            data: { sortOrder: index + 1 },
          })
        )
      );
    }

    const updatedItems = await prisma.foodItem.findMany({
      where: { categoryId },
      include: {
        category: true,
        branchFoodRates: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    console.log("✅ Food item order saved successfully");

    return res.status(200).json({
      success: true,
      message: "Food item order saved successfully",
      data: updatedItems,
    });
  } catch (error) {
    console.error("❌ Reorder food items error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save food item order",
    });
  }
};

// =========================================
// GET FOOD ITEM BY ID
// =========================================

export const getFoodItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        category: true,
        branchFoodRates: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: foodItem,
    });
  } catch (error) {
    console.error("Get food item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch food item",
    });
  }
};

// =========================================
// UPDATE FOOD ITEM
// If category changes, append to new category
// =========================================

export const updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=================================");
    console.log("✏️ UPDATE FOOD ITEM");
    console.log("=================================");
    console.log("🆔 Food ID:", id);
    console.log("📦 Request Body:", req.body);
    console.log("🖼️ Uploaded File:", req.file);

    const {
      categoryId,
      name,
      rate,
      description,
      active,
    } = req.body;

    const existingFoodItem = await prisma.foodItem.findUnique({
      where: { id },
    });

    if (!existingFoodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const targetCategoryId =
      categoryId !== undefined
        ? categoryId
        : existingFoodItem.categoryId;

    if (categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      if (!category.active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign an inactive category",
        });
      }
    }

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Food name cannot be empty",
        });
      }

      const duplicateFoodItem = await prisma.foodItem.findFirst({
        where: {
          name: { equals: trimmedName },
          categoryId: targetCategoryId,
          NOT: { id },
        },
      });

      if (duplicateFoodItem) {
        return res.status(409).json({
          success: false,
          message: "Another food item with this name already exists",
        });
      }
    }

    const updateData = {};

    // IMAGE
    if (req.file) {
      updateData.image = `/uploads/food-items/${req.file.filename}`;
      console.log("🖼️ New Image:", updateData.image);
    }

    // CATEGORY
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;

      // Moving an item to another category appends it there.
      if (categoryId !== existingFoodItem.categoryId) {
        const lastItem = await prisma.foodItem.aggregate({
          where: { categoryId },
          _max: { sortOrder: true },
        });

        updateData.sortOrder = (lastItem._max.sortOrder ?? 0) + 1;
      }
    }

    // NAME
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // RATE
    if (rate !== undefined) {
      const numericRate = Number(rate);

      if (!Number.isFinite(numericRate) || numericRate < 0) {
        return res.status(400).json({
          success: false,
          message: "Rate must be a valid positive number",
        });
      }

      updateData.rate = numericRate;
    }

    // DESCRIPTION
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // ACTIVE
    if (active !== undefined) {
      updateData.active =
        active === true || active === "true";
    }

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        branchFoodRates: {
          include: {
            branch: true,
          },
        },
      },
    });

    console.log("✅ Food Item Updated:", foodItem);

    return res.status(200).json({
      success: true,
      message: "Food item updated successfully",
      data: foodItem,
    });
  } catch (error) {
    console.error("❌ Update food item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update food item",
    });
  }
};

// =========================================
// DELETE / DEACTIVATE FOOD ITEM
// =========================================

export const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFoodItem = await prisma.foodItem.findUnique({
      where: { id },
    });

    if (!existingFoodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data: { active: false },
    });

    return res.status(200).json({
      success: true,
      message: "Food item deactivated successfully",
      data: foodItem,
    });
  } catch (error) {
    console.error("Delete food item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate food item",
    });
  }
};
