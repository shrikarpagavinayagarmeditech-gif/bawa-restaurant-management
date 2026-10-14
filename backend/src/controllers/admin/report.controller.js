import prisma from "../../models/prisma.js";

// ============================================================
// DATE HELPERS
// ============================================================

const getTodayRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// ============================================================
// ADMIN REPORT DASHBOARD SUMMARY
// ============================================================

export const getDashboardSummary = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    // --------------------------------------------------------
    // Get all active branches
    // --------------------------------------------------------

    const branches = await prisma.branch.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // --------------------------------------------------------
    // TODAY'S COMPLETED SALES
    // --------------------------------------------------------

    const sales = await prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        totalAmount: true,
        cashAmount: true,
        upiAmount: true,
        taxAmount: true,
        subtotal: true,
      },
      _count: {
        id: true,
      },
    });

    // --------------------------------------------------------
    // TODAY'S EXPENSES
    // --------------------------------------------------------

    const expenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalSales = Number(sales._sum.totalAmount || 0);
    const cashAmount = Number(sales._sum.cashAmount || 0);
    const upiAmount = Number(sales._sum.upiAmount || 0);
    const totalTax = Number(sales._sum.taxAmount || 0);
    const subtotal = Number(sales._sum.subtotal || 0);

    const totalExpenses = Number(expenses._sum.amount || 0);

    const outstanding = totalSales - totalExpenses;

    // --------------------------------------------------------
    // BRANCH-WISE SUMMARY
    // --------------------------------------------------------

    const branchSummary = await Promise.all(
      branches.map(async (branch) => {
        const branchSales = await prisma.order.aggregate({
          where: {
            branchId: branch.id,
            status: "COMPLETED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            totalAmount: true,
            cashAmount: true,
            upiAmount: true,
          },
          _count: {
            id: true,
          },
        });

        const branchExpenses = await prisma.expense.aggregate({
          where: {
            branchId: branch.id,
            date: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const branchSalesAmount = Number(
          branchSales._sum.totalAmount || 0
        );

        const branchCash = Number(
          branchSales._sum.cashAmount || 0
        );

        const branchUpi = Number(
          branchSales._sum.upiAmount || 0
        );

        const branchExpenseAmount = Number(
          branchExpenses._sum.amount || 0
        );

        return {
          branchId: branch.id,
          branchName: branch.name,

          bills: branchSales._count.id || 0,

          sales: branchSalesAmount,

          cash: branchCash,

          upi: branchUpi,

          expenses: branchExpenseAmount,

          outstanding:
            branchSalesAmount - branchExpenseAmount,
        };
      })
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,

      date: start.toISOString().slice(0, 10),

      summary: {
        bills: sales._count.id || 0,

        subtotal,

        sales: totalSales,

        cash: cashAmount,

        upi: upiAmount,

        tax: totalTax,

        expenses: totalExpenses,

        outstanding,
      },

      branches: branchSummary,
    });
  } catch (error) {
    console.error(
      "REPORT DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load report dashboard",
      error: error.message,
    });
  }




};

// ================================================================
// FOOD-WISE REPORT
// ================================================================

export const getFoodWiseReport = async (req, res) => {
  try {
    const { branchId, from, to } = req.query;

    const where = {
      status: "COMPLETED",
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (from || to) {
      where.completedAt = {};

      if (from) {
        where.completedAt.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        where.completedAt.lte = new Date(`${to}T23:59:59.999`);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
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
        completedAt: "desc"
      }
    });

    const foodMap = {};

    for (const order of orders) {
      for (const item of order.orderitem) {
        const food = item.fooditem;
        if (!food) continue;

        const foodId = item.foodItemId;

        if (!foodMap[foodId]) {
          foodMap[foodId] = {
            foodItemId: foodId,
            foodName: food.name,
            categoryName: food.category?.name || "-",
            quantity: 0,
            salesAmount: 0
          };
        }

        foodMap[foodId].quantity += Number(item.quantity || 0);
        foodMap[foodId].salesAmount += Number(item.amount || 0);
      }
    }

    const data = Object.values(foodMap);

    const totalQuantity = data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const totalSales = data.reduce(
      (sum, item) => sum + item.salesAmount,
      0
    );

    return res.json({
      success: true,
      data,
      summary: {
        totalFoodItems: data.length,
        totalQuantity,
        totalSales,
      },
    });
  } catch (error) {
    console.error("Food wise report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate food-wise report",
    });
  }
};


// ================================================================
// SHIFT-WISE REPORT
// ================================================================

export const getShiftWiseReport = async (req, res) => {
  try {
    const { branchId, from, to } = req.query;

    const where = {
      status: "COMPLETED",
      shiftId: {
        not: null,
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (from || to) {
      where.completedAt = {};

      if (from) {
        where.completedAt.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        where.completedAt.lte = new Date(`${to}T23:59:59.999`);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        shift: true,
      },
    });

    const shiftMap = {};

    for (const order of orders) {
      const shiftId = order.shiftId;

      if (!shiftMap[shiftId]) {
        shiftMap[shiftId] = {
          shiftId,
          shiftName: order.shift?.name || "-",
          startTime: order.shift?.startTime || "-",
          endTime: order.shift?.endTime || "-",
          bills: 0,
          sales: 0,
          cashAmount: 0,
          upiAmount: 0,
          taxAmount: 0,
        };
      }

      shiftMap[shiftId].bills += 1;
      shiftMap[shiftId].sales += Number(order.totalAmount);
      shiftMap[shiftId].cashAmount += Number(order.cashAmount);
      shiftMap[shiftId].upiAmount += Number(order.upiAmount);
      shiftMap[shiftId].taxAmount += Number(order.taxAmount);
    }

    const data = Object.values(shiftMap);

    const totalSales = data.reduce(
      (sum, item) => sum + item.sales,
      0
    );

    const totalBills = data.reduce(
      (sum, item) => sum + item.bills,
      0
    );

    return res.json({
      success: true,
      data,
      summary: {
        totalShifts: data.length,
        totalBills,
        totalSales,
      },
    });
  } catch (error) {
    console.error("Shift wise report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate shift-wise report",
    });
  }
};


// ================================================================
// DAY-WISE REPORT
// ================================================================

export const getDayWiseReport = async (req, res) => {
  try {
    const { branchId, from, to } = req.query;

    const orderWhere = {
      status: "COMPLETED",
    };

    const expenseWhere = {};

    if (branchId) {
      orderWhere.branchId = branchId;
      expenseWhere.branchId = branchId;
    }

    if (from || to) {
      orderWhere.completedAt = {};
      expenseWhere.date = {};

      if (from) {
        orderWhere.completedAt.gte = new Date(`${from}T00:00:00`);
        expenseWhere.date.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        orderWhere.completedAt.lte = new Date(`${to}T23:59:59.999`);
        expenseWhere.date.lte = new Date(`${to}T23:59:59.999`);
      }
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        completedAt: true,
        totalAmount: true,
        cashAmount: true,
        upiAmount: true,
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: {
        date: true,
        amount: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const dayMap = {};

    for (const order of orders) {
      if (!order.completedAt) continue;

      const dateKey = order.completedAt
        .toISOString()
        .slice(0, 10);

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          bills: 0,
          sales: 0,
          cashAmount: 0,
          upiAmount: 0,
          expenses: 0,
          outstanding: 0,
        };
      }

      dayMap[dateKey].bills += 1;
      dayMap[dateKey].sales += Number(order.totalAmount);
      dayMap[dateKey].cashAmount += Number(order.cashAmount);
      dayMap[dateKey].upiAmount += Number(order.upiAmount);
    }

    for (const expense of expenses) {
      const dateKey = new Date(expense.date)
        .toISOString()
        .slice(0, 10);

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          bills: 0,
          sales: 0,
          cashAmount: 0,
          upiAmount: 0,
          expenses: 0,
          outstanding: 0,
        };
      }

      dayMap[dateKey].expenses += Number(expense.amount);
    }

    const data = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        outstanding: item.sales - item.expenses,
      }));

    const totalSales = data.reduce(
      (sum, item) => sum + item.sales,
      0
    );

    const totalExpenses = data.reduce(
      (sum, item) => sum + item.expenses,
      0
    );

    const totalBills = data.reduce(
      (sum, item) => sum + item.bills,
      0
    );

    return res.json({
      success: true,
      data,
      summary: {
        totalBills,
        totalSales,
        totalExpenses,
        outstanding: totalSales - totalExpenses,
      },
    });
  } catch (error) {
    console.error("Day wise report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate day-wise report",
    });
  }
};


// ================================================================
// CUSTOM DATE REPORT
// ================================================================

export const getCustomDateReport = async (req, res) => {
  try {
    const { branchId, from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "From date and to date are required",
      });
    }

    const orderWhere = {
      status: "COMPLETED",
      completedAt: {
        gte: new Date(`${from}T00:00:00`),
        lte: new Date(`${to}T23:59:59.999`),
      },
    };

    const expenseWhere = {
      date: {
        gte: new Date(`${from}T00:00:00`),
        lte: new Date(`${to}T23:59:59.999`),
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId;
      expenseWhere.branchId = branchId;
    }

    const sales = await prisma.order.aggregate({
      where: orderWhere,
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
        subtotal: true,
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        taxAmount: true,
        cashAmount: true,
        upiAmount: true,
      },
    });

    const expenses = await prisma.expense.aggregate({
      where: expenseWhere,
      _sum: {
        amount: true,
      },
    });

    const totalSales = Number(
      sales._sum.totalAmount || 0
    );

    const totalExpenses = Number(
      expenses._sum.amount || 0
    );

    return res.json({
      success: true,
      data: {
        from,
        to,
        bills: sales._count.id,
        subtotal: Number(sales._sum.subtotal || 0),
        taxableAmount: Number(
          sales._sum.taxableAmount || 0
        ),
        cgstAmount: Number(
          sales._sum.cgstAmount || 0
        ),
        sgstAmount: Number(
          sales._sum.sgstAmount || 0
        ),
        taxAmount: Number(
          sales._sum.taxAmount || 0
        ),
        cashAmount: Number(
          sales._sum.cashAmount || 0
        ),
        upiAmount: Number(
          sales._sum.upiAmount || 0
        ),
        totalSales,
        totalExpenses,
        outstanding: totalSales - totalExpenses,
      },
    });
  } catch (error) {
    console.error("Custom date report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate custom date report",
    });
  }


};

// ================================================================
// GST-WISE REPORT
// ================================================================

// ================================================================
// GST-WISE REPORT
// ================================================================

export const getGstWiseReport = async (req, res) => {
  try {
    const { branchId, from, to } = req.query;

    // ------------------------------------------------------------
    // VALIDATE DATE FORMAT
    // ------------------------------------------------------------

    const isValidDate = (value) => {
      if (!value) return true;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    // ------------------------------------------------------------
    // VALIDATE DATE RANGE
    // ------------------------------------------------------------

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be greater than To date.",
      });
    }

    // ------------------------------------------------------------
    // VALIDATE SELECTED BRANCH
    // ------------------------------------------------------------

    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: {
          id: branchId,
        },
        select: {
          id: true,
          name: true,
          active: true,
        },
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "Selected branch not found.",
        });
      }
    }

    // ------------------------------------------------------------
    // BUILD ORDER FILTER
    // ------------------------------------------------------------

    const where = {
      status: "COMPLETED",
    };

    // All branches when branchId is not provided.
    // Selected branch only when branchId is provided.
    if (branchId) {
      where.branchId = branchId;
    }

    // ------------------------------------------------------------
    // DATE FILTER
    // ------------------------------------------------------------

    if (from || to) {
      where.completedAt = {};

      if (from) {
        where.completedAt.gte = new Date(
          `${from}T00:00:00.000`
        );
      }

      if (to) {
        where.completedAt.lte = new Date(
          `${to}T23:59:59.999`
        );
      }
    }

    // ------------------------------------------------------------
    // GET GST SUMMARY
    // ------------------------------------------------------------

    const result = await prisma.order.aggregate({
      where,

      _count: {
        id: true,
      },

      _sum: {
        subtotal: true,
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        taxAmount: true,
        totalAmount: true,
        cashAmount: true,
        upiAmount: true,
      },
    });

    // ------------------------------------------------------------
    // FORMAT AMOUNTS
    // ------------------------------------------------------------

    const toAmount = (value) =>
      Number(Number(value || 0).toFixed(2));

    const summary = {
      totalBills: result._count.id || 0,

      subtotal: toAmount(
        result._sum.subtotal
      ),

      taxableAmount: toAmount(
        result._sum.taxableAmount
      ),

      cgstAmount: toAmount(
        result._sum.cgstAmount
      ),

      sgstAmount: toAmount(
        result._sum.sgstAmount
      ),

      totalGst: toAmount(
        result._sum.taxAmount
      ),

      totalSales: toAmount(
        result._sum.totalAmount
      ),

      cashAmount: toAmount(
        result._sum.cashAmount
      ),

      upiAmount: toAmount(
        result._sum.upiAmount
      ),
    };

    // ------------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------------

    return res.status(200).json({
      success: true,

      filters: {
        branchId: branchId || null,
        from: from || null,
        to: to || null,
      },

      summary,
    });

  } catch (error) {
    console.error(
      "GST WISE REPORT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate GST-wise report.",
    });
  }
};


export const getBranchWiseReport = async (req, res) => {
  try {
    const { branchId, from, to } = req.query;

    const isValidDate = (value) => {
      if (!value) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be after To date.",
      });
    }

    let selectedBranchId = null;

    if (branchId) {
      selectedBranchId = Number(branchId);

      if (!Number.isInteger(selectedBranchId) || selectedBranchId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch ID.",
        });
      }

      const branch = await prisma.branch.findUnique({
        where: { id: selectedBranchId },
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "Branch not found.",
        });
      }
    }

    const orderWhere = { status: "COMPLETED" };
    const expenseWhere = {};

    if (selectedBranchId) {
      orderWhere.branchId = selectedBranchId;
      expenseWhere.branchId = selectedBranchId;
    }

    if (from || to) {
      const start = from
        ? new Date(`${from}T00:00:00.000Z`)
        : new Date("2000-01-01T00:00:00.000Z");

      const end = to
        ? new Date(`${to}T23:59:59.999Z`)
        : new Date();

      orderWhere.completedAt = { gte: start, lte: end };
      expenseWhere.date = { gte: start, lte: end };
    }

    const branches = await prisma.branch.findMany({
      where: selectedBranchId ? { id: selectedBranchId } : {},
      orderBy: { name: "asc" },
    });

    const toAmount = (value) =>
      Number(Number(value || 0).toFixed(2));

    const data = await Promise.all(
      branches.map(async (branch) => {
        const [sales, expenses] = await Promise.all([
          prisma.order.aggregate({
            where: {
              ...orderWhere,
              branchId: branch.id,
            },
            _count: { id: true },
            _sum: {
              subtotal: true,
              totalAmount: true,
              cashAmount: true,
              upiAmount: true,
              taxAmount: true,
            },
          }),
          prisma.expense.aggregate({
            where: {
              ...expenseWhere,
              branchId: branch.id,
            },
            _sum: { amount: true },
          }),
        ]);

        const totalSales = toAmount(sales._sum.totalAmount);
        const totalExpenses = toAmount(expenses._sum.amount);

        return {
          branchId: branch.id,
          branchName: branch.name,
          active: branch.active,
          totalBills: sales._count.id,
          subtotal: toAmount(sales._sum.subtotal),
          totalGst: toAmount(sales._sum.taxAmount),
          totalSales,
          cashAmount: toAmount(sales._sum.cashAmount),
          upiAmount: toAmount(sales._sum.upiAmount),
          totalExpenses,
          outstanding: toAmount(totalSales - totalExpenses),
        };
      })
    );

    const summary = data.reduce(
      (acc, item) => {
        acc.totalBranches += 1;
        acc.totalBills += item.totalBills;
        acc.subtotal += item.subtotal;
        acc.totalGst += item.totalGst;
        acc.totalSales += item.totalSales;
        acc.cashAmount += item.cashAmount;
        acc.upiAmount += item.upiAmount;
        acc.totalExpenses += item.totalExpenses;
        acc.outstanding += item.outstanding;
        return acc;
      },
      {
        totalBranches: 0,
        totalBills: 0,
        subtotal: 0,
        totalGst: 0,
        totalSales: 0,
        cashAmount: 0,
        upiAmount: 0,
        totalExpenses: 0,
        outstanding: 0,
      }
    );

    Object.keys(summary).forEach((key) => {
      if (key !== "totalBranches" && key !== "totalBills") {
        summary[key] = toAmount(summary[key]);
      }
    });

    return res.status(200).json({
      success: true,
      filters: {
        branchId: selectedBranchId,
        from: from || null,
        to: to || null,
      },
      summary,
      data,
    });
  } catch (error) {
    console.error("BRANCH-WISE REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate branch-wise report.",
    });
  }
};


export const getBranchComparisonReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const isValidDate = (value) => {
      if (!value) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be after To date.",
      });
    }

    const orderWhere = { status: "COMPLETED" };
    const expenseWhere = {};

    if (from || to) {
      const start = from
        ? new Date(`${from}T00:00:00.000Z`)
        : new Date("2000-01-01T00:00:00.000Z");

      const end = to
        ? new Date(`${to}T23:59:59.999Z`)
        : new Date();

      orderWhere.completedAt = { gte: start, lte: end };
      expenseWhere.date = { gte: start, lte: end };
    }

    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });

    const toAmount = (value) =>
      Number(Number(value || 0).toFixed(2));

    const data = await Promise.all(
      branches.map(async (branch) => {
        const [sales, expenses] = await Promise.all([
          prisma.order.aggregate({
            where: {
              ...orderWhere,
              branchId: branch.id,
            },
            _count: { id: true },
            _sum: {
              subtotal: true,
              totalAmount: true,
              cashAmount: true,
              upiAmount: true,
              taxAmount: true,
            },
          }),

          prisma.expense.aggregate({
            where: {
              ...expenseWhere,
              branchId: branch.id,
            },
            _sum: { amount: true },
          }),
        ]);

        const totalSales = toAmount(sales._sum.totalAmount);
        const totalExpenses = toAmount(expenses._sum.amount);

        return {
          branchId: branch.id,
          branchName: branch.name,
          active: branch.active,
          totalBills: sales._count.id,
          subtotal: toAmount(sales._sum.subtotal),
          totalGst: toAmount(sales._sum.taxAmount),
          totalSales,
          cashAmount: toAmount(sales._sum.cashAmount),
          upiAmount: toAmount(sales._sum.upiAmount),
          totalExpenses,
          outstanding: toAmount(totalSales - totalExpenses),
        };
      })
    );

    const summary = data.reduce(
      (acc, item) => {
        acc.totalBranches += 1;
        acc.totalBills += item.totalBills;
        acc.totalSales += item.totalSales;
        acc.totalGst += item.totalGst;
        acc.cashAmount += item.cashAmount;
        acc.upiAmount += item.upiAmount;
        acc.totalExpenses += item.totalExpenses;
        acc.outstanding += item.outstanding;

        return acc;
      },
      {
        totalBranches: 0,
        totalBills: 0,
        totalSales: 0,
        totalGst: 0,
        cashAmount: 0,
        upiAmount: 0,
        totalExpenses: 0,
        outstanding: 0,
      }
    );

    Object.keys(summary).forEach((key) => {
      if (key !== "totalBranches" && key !== "totalBills") {
        summary[key] = toAmount(summary[key]);
      }
    });

    return res.status(200).json({
      success: true,
      filters: {
        from: from || null,
        to: to || null,
      },
      summary,
      data,
    });
  } catch (error) {
    console.error("BRANCH COMPARISON REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate branch comparison report.",
    });
  }
};

