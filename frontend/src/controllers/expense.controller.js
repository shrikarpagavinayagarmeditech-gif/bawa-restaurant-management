import api from "../api/api";

const expenseController = {
  getExpenses: async (params = {}) => {
    const response = await api.get("/admin/expenses", {
      params,
    });

    return response.data;
  },

  getExpenseById: async (id) => {
    const response = await api.get(
      `/admin/expenses/${id}`
    );

    return response.data;
  },

  createExpense: async (data) => {
    const response = await api.post(
      "/admin/expenses",
      data
    );

    return response.data;
  },

  updateExpense: async (id, data) => {
    const response = await api.put(
      `/admin/expenses/${id}`,
      data
    );

    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await api.delete(
      `/admin/expenses/${id}`
    );

    return response.data;
  },
};

export default expenseController;