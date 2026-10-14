import prisma from "../../models/prisma.js";

export const createExpense = async (req, res) => {
  try {
    const { branchId, category, amount, date } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch is required",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense category is required",
      });
    }

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
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

    const expense = await prisma.expense.create({
      data: {
        branchId,
        category: category.trim(),
        amount: Number(amount),
        date: new Date(date),
      },
      include: {
        branch: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { branchId, from, to, category } = req.query;

    const where = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (category) {
      where.category = {
        contains: category,
      };
    }

    if (from || to) {
      where.date = {};

      if (from) {
        where.date.gte = new Date(`${from}T00:00:00`);
      }

      if (to) {
        const endDate = new Date(`${to}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);

        where.date.lt = endDate;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    return res.status(200).json({
      success: true,
      data: expenses,
      totalAmount,
      count: expenses.length,
    });
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("GET EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense",
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId, category, amount, date } = req.body;

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch is required",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense category is required",
      });
    }

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
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

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        branchId,
        category: category.trim(),
        amount: Number(amount),
        date: new Date(date),
      },
      include: {
        branch: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
};