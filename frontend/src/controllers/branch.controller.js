import api from "../api/api.js";

// ==========================================
// GET ALL BRANCHES
// ==========================================

export const getBranches = async () => {
  try {
    console.log("🏢 [Branch] Getting all branches...");

    const response = await api.get("/admin/branches");

    console.log(
      "📥 [Branch] Get response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Branch] Get error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// CREATE BRANCH
// ==========================================

export const createBranch = async (data) => {
  try {
    console.log(
      "➕ [Branch] Creating branch:",
      data
    );

    const response = await api.post(
      "/admin/branches",
      data
    );

    console.log(
      "📥 [Branch] Create response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Branch] Create error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// UPDATE BRANCH
// ==========================================

export const updateBranch = async (
  id,
  data
) => {
  try {
    console.log(
      "✏️ [Branch] Updating branch:",
      id,
      data
    );

    const response = await api.put(
      `/admin/branches/${id}`,
      data
    );

    console.log(
      "📥 [Branch] Update response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Branch] Update error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// DELETE BRANCH
// ==========================================

export const deleteBranch = async (id) => {
  try {
    console.log(
      "🗑️ [Branch] Deleting branch:",
      id
    );

    const response = await api.delete(
      `/admin/branches/${id}`
    );

    console.log(
      "📥 [Branch] Delete response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Branch] Delete error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// ACTIVE / INACTIVE
// ==========================================

export const toggleBranchStatus = async (
  id,
  isActive
) => {
  try {
    console.log(
      `🔄 [Branch] ${
        isActive ? "Activating" : "Deactivating"
      }:`,
      id
    );

    const response = await api.put(
      `/admin/branches/${id}`,
      {
        isActive,
      }
    );

    console.log(
      "📥 [Branch] Status response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Branch] Status error:",
      error.response?.data || error.message
    );

    throw error;
  }
};