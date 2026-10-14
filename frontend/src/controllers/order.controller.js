import api from "../api/api";

const orderController = {
  // ============================================
  // ADMIN - GET ALL ORDERS
  // ============================================
  getAdminOrders: async (params = {}) => {
    const response = await api.get("/admin/orders", {
      params,
    });

    return response.data;
  },

  // ============================================
  // ADMIN - GET ORDER DETAILS
  // ============================================
  getAdminOrderById: async (id) => {
    const response = await api.get(`/admin/orders/${id}`);

    return response.data;
  },

  // ============================================
  // BRANCH - GET OWN ORDERS
  // ============================================
  getBranchOrders: async (params = {}) => {
    const response = await api.get("/branch/orders", {
      params,
    });

    return response.data;
  },

  // ============================================
  // BRANCH - GET ORDER DETAILS
  // ============================================
  getBranchOrderById: async (id) => {
    const response = await api.get(`/branch/orders/${id}`);

    return response.data;
  },
};

export default orderController;