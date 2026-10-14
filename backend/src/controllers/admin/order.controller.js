import prisma from "../../models/prisma.js";

// ============================================
// GET ALL ORDERS - ADMIN
// ============================================
export const getOrders = async (req, res) => {
  try {
    const {
      branchId,
      status,
      from,
      to,
      invoiceNumber,
      holdNumber,
    } = req.query;

    const where = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (invoiceNumber) {
      where.invoiceNumber = {
        contains: invoiceNumber,
      };
    }

    if (holdNumber) {
      where.holdNumber = {
        contains: holdNumber,
      };
    }

    if (from || to) {
      where.createdAt = {};

      if (from) {
        where.createdAt.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        const endDate = new Date(`${to}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);

        where.createdAt.lt = endDate;
      }
    }

    const orders = await prisma.order.findMany({
      where: {},
      include: {
        branch: true,
        shift: true,
        orderitem: {
          include: {
            fooditem: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalAmount,
      data: orders,
    });
  } catch (error) {
    console.error("ADMIN GET ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// ============================================
// GET ORDER DETAILS - ADMIN
// ============================================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        branch: true,
        shift: true,
        items: {
          include: {
            foodItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("ADMIN GET ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
};