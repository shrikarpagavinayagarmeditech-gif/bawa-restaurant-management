import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// =========================================
// CREATE SHIFT
// =========================================

export const createShift = async (req, res) => {
  try {
    const {
      name,
      startTime,
      endTime,
      isActive,
    } = req.body;

    console.log("📥 Create shift body:", req.body);

    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Name, start time and end time are required",
      });
    }

    const existingShift =
      await prisma.shift.findFirst({
        where: {
          name: {
            equals: name.trim(),
          },
        },
      });

    if (existingShift) {
      return res.status(409).json({
        success: false,
        message: "Shift already exists",
      });
    }

    const shift =
      await prisma.shift.create({
        data: {
          name: name.trim(),
          startTime,
          endTime,

          // If isActive is not provided,
          // default to true
          active:
            isActive !== undefined
              ? Boolean(isActive)
              : true,
        },
      });

    console.log(
      "✅ Shift created:",
      shift
    );

    return res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: shift,
    });
  } catch (error) {
    console.error(
      "❌ Create shift error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create shift",
    });
  }
};


// =========================================
// GET ALL SHIFTS
// =========================================

export const getShifts = async (req, res) => {
  try {
    const shifts =
      await prisma.shift.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    console.log(
      "📤 Shifts:",
      shifts
    );

    return res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    console.error(
      "❌ Get shifts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shifts",
    });
  }
};


// =========================================
// GET SHIFT BY ID
// =========================================

export const getShiftById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const shift =
      await prisma.shift.findUnique({
        where: {
          id,
        },
        include: {
          orders: {
            orderBy: {
              createdAt: "desc",
            },
            take: 20,
          },
        },
      });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error(
      "❌ Get shift error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shift",
    });
  }
};


// =========================================
// UPDATE SHIFT
// =========================================

export const updateShift = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      startTime,
      endTime,
      isActive,
    } = req.body;

    console.log(
      "📥 Update shift:",
      id,
      req.body
    );

    const existingShift =
      await prisma.shift.findUnique({
        where: {
          id,
        },
      });

    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }


    // =========================================
    // DUPLICATE NAME CHECK
    // =========================================

    if (name) {
      const duplicateShift =
        await prisma.shift.findFirst({
          where: {
            name: {
              equals: name.trim(),
            },
            NOT: {
              id,
            },
          },
        });

      if (duplicateShift) {
        return res.status(409).json({
          success: false,
          message:
            "Another shift with this name already exists",
        });
      }
    }


    // =========================================
    // BUILD UPDATE DATA
    // =========================================

    const updateData = {};

    if (name !== undefined) {
      updateData.name =
        name.trim();
    }

    if (startTime !== undefined) {
      updateData.startTime =
        startTime;
    }

    if (endTime !== undefined) {
      updateData.endTime =
        endTime;
    }

    // IMPORTANT
    // Frontend sends isActive
    // Prisma field is active

    if (isActive !== undefined) {
      updateData.active =
        Boolean(isActive);
    }


    console.log(
      "📤 Prisma update data:",
      updateData
    );


    const shift =
      await prisma.shift.update({
        where: {
          id,
        },
        data: updateData,
      });

    console.log(
      "✅ Shift updated:",
      shift
    );

    return res.status(200).json({
      success: true,
      message: "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    console.error(
      "❌ Update shift error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update shift",
    });
  }
};


// =========================================
// DELETE / DEACTIVATE SHIFT
// =========================================

export const deleteShift = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const existingShift =
      await prisma.shift.findUnique({
        where: {
          id,
        },
        include: {
          orders: {
            take: 1,
          },
        },
      });

    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Historical sales must remain linked.
    // Therefore use soft delete.

    const shift =
      await prisma.shift.update({
        where: {
          id,
        },
        data: {
          active: false,
        },
      });

    console.log(
      "✅ Shift deactivated:",
      shift
    );

    return res.status(200).json({
      success: true,
      message:
        "Shift deactivated successfully",
      data: shift,
    });
  } catch (error) {
    console.error(
      "❌ Delete shift error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to deactivate shift",
    });
  }
};