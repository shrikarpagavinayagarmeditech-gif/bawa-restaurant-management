import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getBranchMenu = async (req, res) => {
  try {
    // branchId comes from the logged-in user's JWT
    const branchId = req.user.branchId;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message: "Branch is not assigned to this user",
      });
    }

    // Make sure the branch itself is active
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

    if (!branch.active) {
      return res.status(403).json({
        success: false,
        message: "Branch is inactive",
      });
    }

    // Get only active food items under active categories
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
  orderBy: [
    {
      category: {
        name: "asc",
      },
    },
    {
      name: "asc",
    },
  ],
});

    const menu = foodItems.map((foodItem) => {
      const branchRate = foodItem.branchFoodRates[0];

      const defaultRate = Number(foodItem.rate);

      const effectiveRate = branchRate
        ? Number(branchRate.rate)
        : defaultRate;

      return {
        id: foodItem.id,
        image: foodItem.image,
        name: foodItem.name,

        category: {
          id: foodItem.category.id,
          name: foodItem.category.name,
        },

        description: foodItem.description,

        defaultRate,

        branchRate: branchRate
          ? Number(branchRate.rate)
          : null,

        effectiveRate,

        hasOverride: Boolean(branchRate),

        active: foodItem.active,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Branch menu fetched successfully",
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
        },
        count: menu.length,
        menu,
      },
    });
  } catch (error) {
    console.error("Get branch menu error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch menu",
    });
  }
};