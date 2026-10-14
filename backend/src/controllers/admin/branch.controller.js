import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create Branch
 */
export const createBranch = async (req, res) => {
  try {
    const {
      name,
      address,
      logo,
      phone,
      gstNumber,
      username,
      password,
    } = req.body;

    const branchName = String(name ?? "").trim();
    const branchAddress = String(address ?? "").trim();
    const branchPhone = String(phone ?? "").trim();
    const branchUsername = String(username ?? "").trim();

    if (
      !branchName ||
      !branchAddress ||
      !branchPhone ||
      !branchUsername ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Branch name, address, phone, username and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        username: branchUsername,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          name: branchName,
          address: branchAddress,
          phone: branchPhone,
          logo: logo || null,
          gstNumber: gstNumber || null,
          active: true,
        },
      });

      const branchUser = await tx.user.create({
        data: {
          username: branchUsername,
          passwordHash,
          role: "BRANCH",
          branchId: branch.id,
          active: true,
        },
      });

      return {
        branch,
        branchUser,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: {
        branch: result.branch,
        user: {
          id: result.branchUser.id,
          username: result.branchUser.username,
          role: result.branchUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Create Branch Error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create branch",
    });
  }
};

/**
 * Get All Branches
 */
export const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            active: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Branches fetched successfully",
      data: branches,
    });
  } catch (error) {
    console.error("Get Branches Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branches",
      error: error.message,
    });
  }
};

/**
 * Get Branch By ID
 */
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: {
        id,
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            role: true,
            active: true,
            createdAt: true,
          },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Branch fetched successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Get Branch Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch",
      error: error.message,
    });
  }
};

/**
 * Update Branch
 */
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      address,
      logo,
      phone,
      gstNumber,
    } = req.body;

    const existingBranch = await prisma.branch.findUnique({
      where: {
        id,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branch = await prisma.branch.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(logo !== undefined && { logo }),
        ...(phone !== undefined && { phone }),
        ...(gstNumber !== undefined && { gstNumber }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Update Branch Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update branch",
      error: error.message,
    });
  }
};

/**
 * Deactivate Branch
 */
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBranch = await prisma.branch.findUnique({
      where: {
        id,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branch = await prisma.branch.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });

    // Disable branch login user also
    await prisma.user.updateMany({
      where: {
        branchId: id,
        role: "BRANCH",
      },
      data: {
        active: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branch deactivated successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Delete Branch Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate branch",
      error: error.message,
    });
  }
};