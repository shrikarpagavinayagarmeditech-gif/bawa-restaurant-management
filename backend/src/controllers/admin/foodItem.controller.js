import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// =========================================
// CREATE FOOD ITEM
// =========================================

export const createFoodItem = async (req, res) => {
  try {

    console.log("=================================");
    console.log("🍴 CREATE FOOD ITEM");
    console.log("=================================");

    console.log("📦 Request Body:", req.body);
    console.log("🖼️ Uploaded File:", req.file);


    const {
      categoryId,
      name,
      rate,
      description,
    } = req.body;


    // =========================================
    // REQUIRED FIELD VALIDATION
    // =========================================

    if (
      !categoryId ||
      !name ||
      rate === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Category, food name and rate are required",
      });
    }


    // =========================================
    // IMAGE REQUIRED
    // =========================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Food image is required",
      });
    }


    // =========================================
    // CHECK CATEGORY
    // =========================================

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
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
        message:
          "Cannot add food to an inactive category",
      });
    }


    // =========================================
    // VALIDATE RATE
    // =========================================

    const numericRate = Number(rate);


    if (
      Number.isNaN(numericRate) ||
      numericRate < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rate must be a valid positive number",
      });
    }


    // =========================================
    // CHECK DUPLICATE FOOD
    // =========================================

    const existingFoodItem =
      await prisma.foodItem.findFirst({
        where: {
          name: {
            equals: name.trim(),
          },
          categoryId,
        },
      });


    if (existingFoodItem) {
      return res.status(409).json({
        success: false,
        message:
          "Food item already exists in this category",
      });
    }


    // =========================================
    // IMAGE PATH
    // =========================================

    const imagePath =
      `/uploads/food-items/${req.file.filename}`;


    console.log(
      "🖼️ Image Path:",
      imagePath
    );


    // =========================================
    // CREATE FOOD ITEM
    // =========================================

    const foodItem =
      await prisma.foodItem.create({
        data: {
          image: imagePath,

          categoryId,

          name:
            name.trim(),

          rate:
            numericRate,

          description:
            description?.trim() || null,

          active: true,
        },

        include: {
          category: true,
        },
      });


    console.log(
      "✅ Food Item Created:",
      foodItem
    );


    return res.status(201).json({
      success: true,
      message:
        "Food item created successfully",
      data: foodItem,
    });

  } catch (error) {

    console.error(
      "❌ Create food item error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to create food item",
    });
  }
};



// =========================================
// GET ALL FOOD ITEMS
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
      orderBy: {
        createdAt: "desc",
      },
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
// GET FOOD ITEM BY ID
// =========================================

export const getFoodItemById = async (req, res) => {
  try {

    const { id } = req.params;


    const foodItem =
      await prisma.foodItem.findUnique({
        where: {
          id,
        },

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
        message:
          "Food item not found",
      });
    }


    return res.status(200).json({
      success: true,
      data: foodItem,
    });

  } catch (error) {

    console.error(
      "Get food item error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch food item",
    });
  }
};



// =========================================
// UPDATE FOOD ITEM
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


    // =========================================
    // FIND EXISTING FOOD
    // =========================================

    const existingFoodItem =
      await prisma.foodItem.findUnique({
        where: {
          id,
        },
      });


    if (!existingFoodItem) {
      return res.status(404).json({
        success: false,
        message:
          "Food item not found",
      });
    }


    // =========================================
    // CHECK CATEGORY
    // =========================================

    if (categoryId) {

      const category =
        await prisma.category.findUnique({
          where: {
            id: categoryId,
          },
        });


      if (!category) {
        return res.status(404).json({
          success: false,
          message:
            "Category not found",
        });
      }


      if (!category.active) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot assign an inactive category",
        });
      }
    }


    // =========================================
    // CHECK DUPLICATE FOOD NAME
    // =========================================

    if (name !== undefined) {

      const duplicateFoodItem =
        await prisma.foodItem.findFirst({
          where: {
            name: {
              equals: name.trim(),
            },

            categoryId:
              categoryId ||
              existingFoodItem.categoryId,

            NOT: {
              id,
            },
          },
        });


      if (duplicateFoodItem) {
        return res.status(409).json({
          success: false,
          message:
            "Another food item with this name already exists",
        });
      }
    }


    // =========================================
    // UPDATE DATA
    // =========================================

    const updateData = {};


    // -----------------------------------------
    // IMAGE
    // -----------------------------------------

    if (req.file) {

      updateData.image =
        `/uploads/food-items/${req.file.filename}`;

      console.log(
        "🖼️ New Image:",
        updateData.image
      );

    }


    // -----------------------------------------
    // CATEGORY
    // -----------------------------------------

    if (categoryId !== undefined) {

      updateData.categoryId =
        categoryId;

    }


    // -----------------------------------------
    // NAME
    // -----------------------------------------

    if (name !== undefined) {

      updateData.name =
        name.trim();

    }


    // -----------------------------------------
    // RATE
    // -----------------------------------------

    if (rate !== undefined) {

      const numericRate =
        Number(rate);


      if (
        Number.isNaN(numericRate) ||
        numericRate < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rate must be a valid positive number",
        });
      }


      updateData.rate =
        numericRate;

    }


    // -----------------------------------------
    // DESCRIPTION
    // -----------------------------------------

    if (description !== undefined) {

      updateData.description =
        description?.trim() || null;

    }


    // -----------------------------------------
    // ACTIVE
    // -----------------------------------------

    if (active !== undefined) {

      updateData.active =
        active === true ||
        active === "true";

    }


    // =========================================
    // UPDATE DATABASE
    // =========================================

    const foodItem =
      await prisma.foodItem.update({

        where: {
          id,
        },

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


    console.log(
      "✅ Food Item Updated:",
      foodItem
    );


    return res.status(200).json({
      success: true,
      message:
        "Food item updated successfully",
      data: foodItem,
    });

  } catch (error) {

    console.error(
      "❌ Update food item error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to update food item",
    });
  }
};



// =========================================
// DELETE / DEACTIVATE FOOD ITEM
// =========================================

export const deleteFoodItem = async (req, res) => {
  try {

    const { id } = req.params;


    const existingFoodItem =
      await prisma.foodItem.findUnique({
        where: {
          id,
        },
      });


    if (!existingFoodItem) {
      return res.status(404).json({
        success: false,
        message:
          "Food item not found",
      });
    }


    const foodItem =
      await prisma.foodItem.update({
        where: {
          id,
        },

        data: {
          active: false,
        },
      });


    return res.status(200).json({
      success: true,
      message:
        "Food item deactivated successfully",
      data: foodItem,
    });

  } catch (error) {

    console.error(
      "Delete food item error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to deactivate food item",
    });
  }
};