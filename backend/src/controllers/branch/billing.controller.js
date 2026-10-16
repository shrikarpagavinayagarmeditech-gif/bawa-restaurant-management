import prisma from "../../models/prisma.js";
import {
  generateInvoiceNumber,
  generateHoldNumber,
} from "../../services/billingSequence.service.js";

/**
 * Get active shift
 */
async function getActiveShift() {
  return await prisma.shift.findFirst({
    where: {
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get effective food rate for a branch.
 *
 * Branch-specific rate is used if available.
 * Otherwise default FoodItem rate is used.
 */
async function getFoodRate(branchId, foodItemId) {
  const branchRate = await prisma.branchFoodRate.findUnique({
    where: {
      branchId_foodItemId: {
        branchId,
        foodItemId,
      },
    },
  });

  if (branchRate) {
    return Number(branchRate.rate);
  }

  const foodItem = await prisma.foodItem.findUnique({
    where: {
      id: foodItemId,
    },
  });

  if (!foodItem) {
    throw new Error(`Food item not found: ${foodItemId}`);
  }

  return Number(foodItem.rate);
}

/**
 * Calculate bill amounts
 *
 * GST:
 * CGST = 2.5%
 * SGST = 2.5%
 * Total GST = 5%
 */
function calculateBillAmounts(items, discountAmount = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const discount = Math.max(0, Number(discountAmount || 0));

  if (discount > subtotal) {
    throw new Error("Discount cannot be greater than subtotal");
  }

  const taxableAmount = subtotal - discount;

  const cgstAmount = taxableAmount * 0.025;
  const sgstAmount = taxableAmount * 0.025;

  const taxAmount = cgstAmount + sgstAmount;

  const totalAmount = taxableAmount + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Validate payment
 */
function validatePayment(
  paymentMethod,
  totalAmount,
  cashAmount = 0,
  upiAmount = 0
) {
  const total = Number(totalAmount);
  const cash = Number(cashAmount || 0);
  const upi = Number(upiAmount || 0);

  if (!["CASH", "UPI", "SPLIT"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  if (paymentMethod === "CASH") {
    if (Math.abs(cash - total) > 0.01) {
      throw new Error("Cash amount must equal total amount");
    }

    return {
      cashAmount: total,
      upiAmount: 0,
    };
  }

  if (paymentMethod === "UPI") {
    if (Math.abs(upi - total) > 0.01) {
      throw new Error("UPI amount must equal total amount");
    }

    return {
      cashAmount: 0,
      upiAmount: total,
    };
  }

  if (paymentMethod === "SPLIT") {
    if (cash <= 0 || upi <= 0) {
      throw new Error(
        "Split payment must contain both cash and UPI amounts"
      );
    }

    if (Math.abs(cash + upi - total) > 0.01) {
      throw new Error(
        "Cash amount + UPI amount must equal total amount"
      );
    }

    return {
      cashAmount: Number(cash.toFixed(2)),
      upiAmount: Number(upi.toFixed(2)),
    };
  }
}

/**
 * Build order items with current branch rates
 */
async function prepareOrderItems(branchId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one food item is required");
  }

  const preparedItems = [];

  for (const item of items) {
    const foodItemId = item.foodItemId;
    const quantity = Number(item.quantity);

    if (!foodItemId) {
      throw new Error("foodItemId is required");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }

    const rate = await getFoodRate(branchId, foodItemId);

    const amount = Number((rate * quantity).toFixed(2));

    preparedItems.push({
      foodItemId,
      quantity,
      rate,
      amount,
    });
  }

  return preparedItems;
}

/**
 * HOLD BILL
 *
 * Creates a DRAFT order and assigns only a hold number.
 *
 * Invoice number is NOT generated here.
 */

export async function holdBill(req, res) {
  try {
    const branchId = req.user.branchId;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch user is not linked to a branch",
      });
    }

    const {
      items,
      discountAmount = 0,
    } = req.body;

    const preparedItems = await prepareOrderItems(
      branchId,
      items
    );

    const amounts = calculateBillAmounts(
      preparedItems,
      discountAmount
    );

    const shift = await getActiveShift();

    const result = await prisma.$transaction(async (tx) => {
      const holdNumber = await generateHoldNumber(
        tx,
        branchId
      );

      const order = await tx.order.create({
        data: {
          branchId,
          shiftId: shift?.id || null,
          status: "DRAFT",
          holdNumber,
          invoiceNumber: null,
          paymentMethod: null,
          cashAmount: 0,
          upiAmount: 0,

          subtotal: amounts.subtotal,
          discountAmount: amounts.discountAmount,
          taxableAmount: amounts.taxableAmount,
          cgstAmount: amounts.cgstAmount,
          sgstAmount: amounts.sgstAmount,
          taxAmount: amounts.taxAmount,
          totalAmount: amounts.totalAmount,

          // Correct relation name from schema.prisma
          orderitem: {
            create: preparedItems.map((item) => ({
              foodItemId: item.foodItemId,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            })),
          },
        },
        include: {
          orderitem: true,
        },
      });

      // Preserve the "items" property expected by the frontend.
      const { orderitem, ...orderData } = order;

      return {
        ...orderData,
        items: orderitem,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Bill held successfully",
      data: result,
    });
  } catch (error) {
    console.error("Hold bill error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to hold bill",
    });
  }
}


/**
 * GET HOLD / DRAFT BILLS
 */


export async function getHeldBills(req, res) {
  try {
    const branchId = req.user.branchId;

    const orders = await prisma.order.findMany({
      where: {
        branchId,
        status: "DRAFT",
        holdNumber: {
          not: null,
        },
      },
      include: {
        orderitem: {
          include: {
            fooditem: true,
          },
        },
        shift: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get held bills error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch held bills",
    });
  }
}



/**
 * GET SINGLE DRAFT BILL
 */
export async function getDraftBill(req, res) {
  try {
    const branchId = req.user.branchId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        branchId,
        status: "DRAFT",
      },

      include: {
        items: {
          include: {
            foodItem: true,
          },
        },
        shift: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Draft bill not found",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get draft bill error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch draft bill",
    });
  }
}

/**
 * UPDATE DRAFT BILL
 */
export async function updateDraftBill(req, res) {
  try {
    const branchId = req.user.branchId;
    const { id } = req.params;

    const {
      items,
      discountAmount = 0,
    } = req.body;

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        branchId,
        status: "DRAFT",
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Draft bill not found",
      });
    }

    const preparedItems = await prepareOrderItems(
      branchId,
      items
    );

    const amounts = calculateBillAmounts(
      preparedItems,
      discountAmount
    );

    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        await tx.orderItem.deleteMany({
          where: {
            orderId: id,
          },
        });

        return await tx.order.update({
          where: {
            id,
          },

          data: {
            subtotal: amounts.subtotal,
            discountAmount: amounts.discountAmount,
            taxableAmount: amounts.taxableAmount,

            cgstAmount: amounts.cgstAmount,
            sgstAmount: amounts.sgstAmount,
            taxAmount: amounts.taxAmount,

            totalAmount: amounts.totalAmount,

            items: {
              create: preparedItems.map((item) => ({
                foodItemId: item.foodItemId,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount,
              })),
            },
          },

          include: {
            items: true,
          },
        });
      }
    );

    return res.json({
      success: true,
      message: "Draft bill updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Update draft bill error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update draft bill",
    });
  }
}

/**
 * COMPLETE BILL
 *
 * Invoice number is generated ONLY here.
 */
export async function completeBill(req, res) {
  try {
    const branchId = req.user.branchId;
    const { id } = req.params;

    const {
      paymentMethod,
      cashAmount = 0,
      upiAmount = 0,
    } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        branchId,
        status: "DRAFT",
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Draft bill not found",
      });
    }

    const payment = validatePayment(
      paymentMethod,
      order.totalAmount,
      cashAmount,
      upiAmount
    );

    const completedOrder = await prisma.$transaction(
      async (tx) => {
        const invoiceNumber = await generateInvoiceNumber(
          tx,
          branchId
        );

        return await tx.order.update({
          where: {
            id,
          },

          data: {
            status: "COMPLETED",

            invoiceNumber,

            paymentMethod,

            cashAmount: payment.cashAmount,
            upiAmount: payment.upiAmount,

            completedAt: new Date(),
          },

          include: {
            items: {
              include: {
                foodItem: true,
              },
            },
            branch: true,
            shift: true,
          },
        });
      }
    );

    return res.json({
      success: true,
      message: "Bill completed successfully",
      data: completedOrder,
    });
  } catch (error) {
    console.error("Complete bill error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to complete bill",
    });
  }
}

/**
 * CANCEL BILL
 */
export async function cancelBill(req, res) {
  try {
    const branchId = req.user.branchId;
    const { id } = req.params;

    const {
      cancellationReason,
    } = req.body;

    if (!cancellationReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        branchId,
        status: "DRAFT",
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Draft bill not found",
      });
    }

    const cancelledOrder = await prisma.order.update({
      where: {
        id,
      },

      data: {
        status: "CANCELLED",
        cancellationReason: cancellationReason.trim(),
        cancelledAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Bill cancelled successfully",
      data: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel bill error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel bill",
    });
  }
}

/**
 * TODAY'S BILLING SUMMARY
 *
 * Completed bills only.
 *
 * Cancelled bills are excluded.
 */
export async function getTodaySummary(req, res) {
  try {
    const branchId = req.user.branchId;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const completedOrders = await prisma.order.findMany({
      where: {
        branchId,
        status: "COMPLETED",
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },

      select: {
        totalAmount: true,
        cashAmount: true,
        upiAmount: true,
      },
    });

    const bills = completedOrders.length;

    const cashAmount = completedOrders.reduce(
      (sum, order) => sum + Number(order.cashAmount),
      0
    );

    const upiAmount = completedOrders.reduce(
      (sum, order) => sum + Number(order.upiAmount),
      0
    );

    const totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const expenses = await prisma.expense.findMany({
      where: {
        branchId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },

      select: {
        amount: true,
      },
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const outstanding = totalSales - totalExpenses;

    return res.json({
      success: true,

      data: {
        bills,

        totalSales: Number(totalSales.toFixed(2)),

        cashAmount: Number(cashAmount.toFixed(2)),

        upiAmount: Number(upiAmount.toFixed(2)),

        totalExpenses: Number(totalExpenses.toFixed(2)),

        outstanding: Number(outstanding.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Today summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's summary",
    });
  }
}