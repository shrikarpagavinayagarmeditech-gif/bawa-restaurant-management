import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const setBranchFoodRate = async (req, res) => {
  try {
    const { branchId, foodItemId, rate } = req.body;

    if (!branchId || !foodItemId || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Branch, food item and rate are required",
      });
    }

    const numericRate = Number(rate);

    if (Number.isNaN(numericRate) || numericRate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a valid positive number",
      });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
    });

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const branchRate = await prisma.branchFoodRate.upsert({
      where: {
        branchId_foodItemId: {
          branchId,
          foodItemId,
        },
      },
      update: {
        rate: numericRate,
      },
      create: {
        branchId,
        foodItemId,
        rate: numericRate,
      },
      include: {
        branch: true,
        fooditem: {
          include: {
            category: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branch food rate saved successfully",
      data: branchRate,
    });
  } catch (error) {
    console.error("Set branch food rate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save branch food rate",
    });
  }
};


export const getBranchFoodRates = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const foodItems = await prisma.foodItem.findMany({
      where: {
        active: true,
        category: {
          active: true,
        },
      },
      include: {
        category: true,
        branchFoodRates: {
          where: {
            branchId,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const data = foodItems.map((foodItem) => {
      const branchRate = foodItem.branchFoodRates[0];

      return {
        foodItemId: foodItem.id,
        foodName: foodItem.name,
        categoryId: foodItem.categoryId,
        categoryName: foodItem.category.name,

        defaultRate: Number(foodItem.rate),

        branchRate: branchRate
          ? Number(branchRate.rate)
          : null,

        effectiveRate: branchRate
          ? Number(branchRate.rate)
          : Number(foodItem.rate),

        hasOverride: Boolean(branchRate),
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get branch food rates error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch food rates",
    });
  }
};

export const deleteBranchFoodRate = async (req, res) => {
  try {
    const { branchId, foodItemId } = req.params;

    const existingRate = await prisma.branchFoodRate.findUnique({
      where: {
        branchId_foodItemId: {
          branchId,
          foodItemId,
        },
      },
    });

    if (!existingRate) {
      return res.status(404).json({
        success: false,
        message: "Branch rate override not found",
      });
    }

    await prisma.branchFoodRate.delete({
      where: {
        branchId_foodItemId: {
          branchId,
          foodItemId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branch rate override removed. Default rate will be used.",
    });
  } catch (error) {
    console.error("Delete branch food rate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove branch food rate",
    });
  }
};