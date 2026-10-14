import { PrismaClient } from "@prisma/client";
import {
  generateInvoiceNumber,
  generateHoldNumber,
} from "../../services/billingSequence.service.js";

const prisma = new PrismaClient();

// ============================================================
// HELPER: Get Active Shift
// ============================================================

const getActiveShift = async () => {
  const shifts = await prisma.shift.findMany({
    where: {
      active: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (shifts.length === 0) {
    return null;
  }

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  for (const shift of shifts) {
    const [startHour, startMinute] = shift.startTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] = shift.endTime
      .split(":")
      .map(Number);

    const startMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    // Normal shift
    if (startMinutes < endMinutes) {
      if (
        currentMinutes >= startMinutes &&
        currentMinutes < endMinutes
      ) {
        return shift;
      }
    }

    // Overnight shift
    else {
      if (
        currentMinutes >= startMinutes ||
        currentMinutes < endMinutes
      ) {
        return shift;
      }
    }
  }

  return null;
};

// ============================================================
// HELPER: Get Effective Food Rate
// ============================================================
// Branch override irundha branch rate.
// Illana default FoodItem rate.
// ============================================================

const getEffectiveFoodRate = async (
  branchId,
  foodItemId
) => {
  const foodItem = await prisma.foodItem.findUnique({
    where: {
      id: foodItemId,
    },

    include: {
      category: true,

      // IMPORTANT:
      // Current Prisma schema relation name
      // is branchFoodRates
      branchFoodRates: {
        where: {
          branchId,
        },
      },
    },
  });

  if (!foodItem) {
    return null;
  }

  // Food inactive
  if (!foodItem.active) {
    return null;
  }

  // Category inactive
  if (!foodItem.category || !foodItem.category.active) {
    return null;
  }

  const branchRate = foodItem.branchFoodRates[0];

  return {
    foodItem,

    rate: branchRate
      ? Number(branchRate.rate)
      : Number(foodItem.rate),
  };
};

// ============================================================
// HELPER: Validate Payment
// ============================================================

const validatePayment = (
  paymentMethod,
  totalAmount,
  cashAmount = 0,
  upiAmount = 0
) => {
  const numericCash = Number(cashAmount || 0);
  const numericUpi = Number(upiAmount || 0);
  const numericTotal = Number(totalAmount);

  if (
    paymentMethod !== "CASH" &&
    paymentMethod !== "UPI" &&
    paymentMethod !== "SPLIT"
  ) {
    return {
      valid: false,
      message:
        "Payment method must be CASH, UPI or SPLIT",
    };
  }

  if (
    Number.isNaN(numericCash) ||
    Number.isNaN(numericUpi) ||
    numericCash < 0 ||
    numericUpi < 0
  ) {
    return {
      valid: false,
      message: "Invalid payment amount",
    };
  }

  if (paymentMethod === "CASH") {
    if (Math.abs(numericCash - numericTotal) > 0.01) {
      return {
        valid: false,
        message:
          "Cash amount must be equal to total amount",
      };
    }

    return {
      valid: true,
      cashAmount: numericTotal,
      upiAmount: 0,
    };
  }

  if (paymentMethod === "UPI") {
    if (Math.abs(numericUpi - numericTotal) > 0.01) {
      return {
        valid: false,
        message:
          "UPI amount must be equal to total amount",
      };
    }

    return {
      valid: true,
      cashAmount: 0,
      upiAmount: numericTotal,
    };
  }

  // SPLIT
  if (
    Math.abs(
      numericCash + numericUpi - numericTotal
    ) > 0.01
  ) {
    return {
      valid: false,
      message:
        "Cash amount + UPI amount must equal total amount",
    };
  }

  return {
    valid: true,
    cashAmount: numericCash,
    upiAmount: numericUpi,
  };
};

// ============================================================
// HELPER: Prepare Order Items
// ============================================================

const prepareOrderItems = async (
  branchId,
  items
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "At least one food item is required"
    );
  }

  const orderItems = [];

  let subtotal = 0;

  for (const item of items) {
    const foodItemId = item.foodItemId;

    const quantity = Number(item.quantity);

    if (!foodItemId) {
      throw new Error(
        "Food item ID is required"
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Quantity must be a positive whole number"
      );
    }

    const foodData =
      await getEffectiveFoodRate(
        branchId,
        foodItemId
      );

    if (!foodData) {
      throw new Error(
        `Food item ${foodItemId} is unavailable`
      );
    }

    const rate = Number(foodData.rate);

    const amount = rate * quantity;

    subtotal += amount;

    orderItems.push({
      foodItemId,
      quantity,
      rate,
      amount,
    });
  }

  return {
    orderItems,
    subtotal,
  };
};

// ============================================================
// HELPER: Calculate Bill Amounts
// ============================================================

const calculateBillAmounts = ({
  subtotal,
  discountAmount = 0,
}) => {
  const numericSubtotal = Number(subtotal);

  const numericDiscount =
    Number(discountAmount || 0);

  if (numericDiscount < 0) {
    throw new Error(
      "Discount cannot be negative"
    );
  }

  if (numericDiscount > numericSubtotal) {
    throw new Error(
      "Discount cannot be greater than subtotal"
    );
  }

  const taxableAmount =
    numericSubtotal - numericDiscount;

  // Current requirement:
  // CGST 2.5%
  // SGST 2.5%
  // Total GST 5%
  const cgstAmount =
    taxableAmount * 0.025;

  const sgstAmount =
    taxableAmount * 0.025;

  const taxAmount =
    cgstAmount + sgstAmount;

  const totalAmount =
    taxableAmount + taxAmount;

  return {
    subtotal: Number(
      numericSubtotal.toFixed(2)
    ),

    discountAmount: Number(
      numericDiscount.toFixed(2)
    ),

    taxableAmount: Number(
      taxableAmount.toFixed(2)
    ),

    cgstAmount: Number(
      cgstAmount.toFixed(2)
    ),

    sgstAmount: Number(
      sgstAmount.toFixed(2)
    ),

    taxAmount: Number(
      taxAmount.toFixed(2)
    ),

    totalAmount: Number(
      totalAmount.toFixed(2)
    ),
  };
};

// ============================================================
// CREATE DRAFT ORDER
// ============================================================

export const createDraftOrder = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    const {
      items,
      discountAmount = 0,
    } = req.body;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    // Verify branch
    const branch =
      await prisma.branch.findUnique({
        where: {
          id: branchId,
        },
      });

    if (!branch || !branch.active) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is inactive or not found",
      });
    }

    // Prepare items
    let prepared;

    try {
      prepared =
        await prepareOrderItems(
          branchId,
          items
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Calculate
    let amounts;

    try {
      amounts =
        calculateBillAmounts({
          subtotal: prepared.subtotal,
          discountAmount,
        });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate hold number
    const order =
      await prisma.$transaction(
        async (tx) => {
          const holdNumber =
            await generateHoldNumber(
              tx,
              branchId
            );

          return tx.order.create({
            data: {
              branchId,

              status: "DRAFT",

              holdNumber,

              invoiceNumber: null,

              paymentMethod: null,

              cashAmount: 0,

              upiAmount: 0,

              subtotal:
                amounts.subtotal,

              discountAmount:
                amounts.discountAmount,

              taxableAmount:
                amounts.taxableAmount,

              cgstAmount:
                amounts.cgstAmount,

              sgstAmount:
                amounts.sgstAmount,

              taxAmount:
                amounts.taxAmount,

              totalAmount:
                amounts.totalAmount,

              shiftId: null,

              items: {
                create:
                  prepared.orderItems,
              },
            },

            include: {
              items: {
                include: {
                  foodItem: {
                    include: {
                      category: true,
                    },
                  },
                },
              },

              branch: true,

              shift: true,
            },
          });
        }
      );

    return res.status(201).json({
      success: true,
      message:
        "Draft bill created successfully",
      data: {
        ...order,

        subtotal:
          Number(order.subtotal),

        discountAmount:
          Number(order.discountAmount),

        taxableAmount:
          Number(order.taxableAmount),

        cgstAmount:
          Number(order.cgstAmount),

        sgstAmount:
          Number(order.sgstAmount),

        taxAmount:
          Number(order.taxAmount),

        totalAmount:
          Number(order.totalAmount),

        cashAmount:
          Number(order.cashAmount),

        upiAmount:
          Number(order.upiAmount),

        items:
          order.items.map((item) => ({
            ...item,
            rate: Number(item.rate),
            amount: Number(item.amount),
          })),
      },
    });
  } catch (error) {
    console.error(
      "Create draft order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create draft bill",
    });
  }
};

// ============================================================
// GET ALL DRAFTS
// ============================================================

export const getDraftOrders = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    const drafts =
      await prisma.order.findMany({
        where: {
          branchId,
          status: "DRAFT",
        },

        include: {
          items: {
            include: {
              foodItem: {
                include: {
                  category: true,
                },
              },
            },
          },

          shift: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const data = drafts.map(
      (order) => ({
        id: order.id,

        holdNumber:
          order.holdNumber,

        invoiceNumber:
          order.invoiceNumber,

        status:
          order.status,

        subtotal:
          Number(order.subtotal),

        discountAmount:
          Number(order.discountAmount),

        taxableAmount:
          Number(order.taxableAmount),

        cgstAmount:
          Number(order.cgstAmount),

        sgstAmount:
          Number(order.sgstAmount),

        taxAmount:
          Number(order.taxAmount),

        totalAmount:
          Number(order.totalAmount),

        cashAmount:
          Number(order.cashAmount),

        upiAmount:
          Number(order.upiAmount),

        createdAt:
          order.createdAt,

        itemCount:
          order.items.reduce(
            (total, item) =>
              total + item.quantity,
            0
          ),

        items:
          order.items.map(
            (item) => ({
              id: item.id,

              foodItemId:
                item.foodItemId,

              foodName:
                item.foodItem.name,

              quantity:
                item.quantity,

              rate:
                Number(item.rate),

              amount:
                Number(item.amount),
            })
          ),
      })
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Get draft orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch draft bills",
    });
  }
};

// ============================================================
// GET ORDER BY ID
// ============================================================

export const getOrderById = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    const { id } = req.params;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    const order =
      await prisma.order.findFirst({
        where: {
          id,
          branchId,
        },

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
        message: "Bill not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        ...order,

        subtotal:
          Number(order.subtotal),

        discountAmount:
          Number(order.discountAmount),

        taxableAmount:
          Number(order.taxableAmount),

        cgstAmount:
          Number(order.cgstAmount),

        sgstAmount:
          Number(order.sgstAmount),

        taxAmount:
          Number(order.taxAmount),

        totalAmount:
          Number(order.totalAmount),

        cashAmount:
          Number(order.cashAmount),

        upiAmount:
          Number(order.upiAmount),

        items:
          order.items.map(
            (item) => ({
              ...item,

              rate:
                Number(item.rate),

              amount:
                Number(item.amount),
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch bill",
    });
  }
};

// ============================================================
// GET ALL BRANCH ORDERS
// ============================================================

export const getOrders = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    const {
      status,
      from,
      to,
      invoiceNumber,
      holdNumber,
    } = req.query;

    const where = {
      branchId,
    };

    // Status
    if (status) {
      where.status = status;
    }

    // Invoice search
    if (invoiceNumber) {
      where.invoiceNumber = {
        contains: invoiceNumber,
      };
    }

    // Hold search
    if (holdNumber) {
      where.holdNumber = {
        contains: holdNumber,
      };
    }

    // Date filter
    if (from || to) {
      where.createdAt = {};

      if (from) {
        where.createdAt.gte =
          new Date(
            `${from}T00:00:00`
          );
      }

      if (to) {
        const endDate =
          new Date(
            `${to}T00:00:00`
          );

        endDate.setDate(
          endDate.getDate() + 1
        );

        where.createdAt.lt =
          endDate;
      }
    }

    const orders =
      await prisma.order.findMany({
        where,

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

        orderBy: {
          createdAt: "desc",
        },
      });

    const totalAmount =
      orders.reduce(
        (sum, order) =>
          sum +
          Number(order.totalAmount),
        0
      );

    return res.status(200).json({
      success: true,

      count: orders.length,

      totalAmount,

      data: orders.map(
        (order) => ({
          ...order,

          subtotal:
            Number(order.subtotal),

          discountAmount:
            Number(
              order.discountAmount
            ),

          taxableAmount:
            Number(
              order.taxableAmount
            ),

          cgstAmount:
            Number(order.cgstAmount),

          sgstAmount:
            Number(order.sgstAmount),

          taxAmount:
            Number(order.taxAmount),

          totalAmount:
            Number(order.totalAmount),

          cashAmount:
            Number(order.cashAmount),

          upiAmount:
            Number(order.upiAmount),

          items:
            order.items.map(
              (item) => ({
                ...item,

                rate:
                  Number(item.rate),

                amount:
                  Number(item.amount),
              })
            ),
        })
      ),
    });
  } catch (error) {
    console.error(
      "Get branch orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch orders",
    });
  }
};

// ============================================================
// UPDATE DRAFT
// ============================================================

export const updateDraftOrder = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    const { id } = req.params;

    const {
      items,
      discountAmount = 0,
    } = req.body;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one food item is required",
      });
    }

    const existingOrder =
      await prisma.order.findFirst({
        where: {
          id,
          branchId,
        },
      });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Draft bill not found",
      });
    }

    if (existingOrder.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft bills can be updated",
      });
    }

    let prepared;

    try {
      prepared =
        await prepareOrderItems(
          branchId,
          items
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    let amounts;

    try {
      amounts =
        calculateBillAmounts({
          subtotal:
            prepared.subtotal,

          discountAmount,
        });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const updatedOrder =
      await prisma.$transaction(
        async (tx) => {
          await tx.orderItem.deleteMany({
            where: {
              orderId: id,
            },
          });

          return tx.order.update({
            where: {
              id,
            },

            data: {
              subtotal:
                amounts.subtotal,

              discountAmount:
                amounts.discountAmount,

              taxableAmount:
                amounts.taxableAmount,

              cgstAmount:
                amounts.cgstAmount,

              sgstAmount:
                amounts.sgstAmount,

              taxAmount:
                amounts.taxAmount,

              totalAmount:
                amounts.totalAmount,

              items: {
                create:
                  prepared.orderItems,
              },
            },

            include: {
              items: {
                include: {
                  foodItem: {
                    include: {
                      category: true,
                    },
                  },
                },
              },

              branch: true,

              shift: true,
            },
          });
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Draft bill updated successfully",

      data: {
        ...updatedOrder,

        subtotal:
          Number(
            updatedOrder.subtotal
          ),

        discountAmount:
          Number(
            updatedOrder.discountAmount
          ),

        taxableAmount:
          Number(
            updatedOrder.taxableAmount
          ),

        cgstAmount:
          Number(
            updatedOrder.cgstAmount
          ),

        sgstAmount:
          Number(
            updatedOrder.sgstAmount
          ),

        taxAmount:
          Number(
            updatedOrder.taxAmount
          ),

        totalAmount:
          Number(
            updatedOrder.totalAmount
          ),

        items:
          updatedOrder.items.map(
            (item) => ({
              ...item,

              rate:
                Number(item.rate),

              amount:
                Number(item.amount),
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Update draft order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update draft bill",
    });
  }
};

// ============================================================
// COMPLETE DRAFT
// ============================================================

export const completeDraftOrder = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    const { id } = req.params;

    const {
      paymentMethod,
      cashAmount = 0,
      upiAmount = 0,
    } = req.body;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    const existingOrder =
      await prisma.order.findFirst({
        where: {
          id,
          branchId,
        },

        include: {
          items: true,
        },
      });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Draft bill not found",
      });
    }

    if (existingOrder.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft bills can be completed",
      });
    }

    if (existingOrder.items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot complete an empty bill",
      });
    }

    // ========================================================
    // ACTIVE SHIFT
    // ========================================================

    const activeShift =
      await getActiveShift();

    if (!activeShift) {
      return res.status(400).json({
        success: false,
        message:
          "No active shift found for the current time",
      });
    }

    // ========================================================
    // PAYMENT
    // ========================================================

    const totalAmount =
      Number(existingOrder.totalAmount);

    const payment =
      validatePayment(
        paymentMethod,
        totalAmount,
        cashAmount,
        upiAmount
      );

    if (!payment.valid) {
      return res.status(400).json({
        success: false,
        message: payment.message,
      });
    }

    // ========================================================
    // TRANSACTION
    // ========================================================

    const completedOrder =
      await prisma.$transaction(
        async (tx) => {
          // Generate invoice ONLY when completing.
          const invoiceNumber =
            await generateInvoiceNumber(
              tx,
              branchId
            );

          return tx.order.update({
            where: {
              id,
            },

            data: {
              status: "COMPLETED",

              invoiceNumber,

              shiftId:
                activeShift.id,

              paymentMethod,

              cashAmount:
                payment.cashAmount,

              upiAmount:
                payment.upiAmount,

              completedAt:
                new Date(),
            },

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
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Draft bill completed successfully",

      data: {
        ...completedOrder,

        subtotal:
          Number(
            completedOrder.subtotal
          ),

        discountAmount:
          Number(
            completedOrder.discountAmount
          ),

        taxableAmount:
          Number(
            completedOrder.taxableAmount
          ),

        cgstAmount:
          Number(
            completedOrder.cgstAmount
          ),

        sgstAmount:
          Number(
            completedOrder.sgstAmount
          ),

        taxAmount:
          Number(
            completedOrder.taxAmount
          ),

        totalAmount:
          Number(
            completedOrder.totalAmount
          ),

        cashAmount:
          Number(
            completedOrder.cashAmount
          ),

        upiAmount:
          Number(
            completedOrder.upiAmount
          ),

        items:
          completedOrder.items.map(
            (item) => ({
              ...item,

              rate:
                Number(item.rate),

              amount:
                Number(item.amount),
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Complete draft order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete draft bill",
    });
  }
};

// ============================================================
// CANCEL DRAFT
// ============================================================

export const cancelDraftOrder = async (
  req,
  res
) => {
  try {
    const branchId = req.user.branchId;

    const { id } = req.params;

    const {
      cancellationReason,
    } = req.body;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message:
          "Branch is not assigned to this user",
      });
    }

    const existingOrder =
      await prisma.order.findFirst({
        where: {
          id,
          branchId,
        },
      });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    if (existingOrder.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft bills can be cancelled",
      });
    }

    const order =
      await prisma.order.update({
        where: {
          id,
        },

        data: {
          status: "CANCELLED",

          cancellationReason:
            cancellationReason ||
            "Cancelled by branch",
          
          cancelledAt:
            new Date(),
        },
      });

    return res.status(200).json({
      success: true,

      message:
        "Draft bill cancelled successfully",

      data: order,
    });
  } catch (error) {
    console.error(
      "Cancel draft order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel draft bill",
    });
  }
};