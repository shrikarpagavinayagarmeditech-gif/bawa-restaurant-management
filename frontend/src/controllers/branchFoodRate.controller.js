import api from "../api/api.js";

// ==========================================
// SET / UPDATE BRANCH FOOD RATE
// ==========================================

export const setBranchFoodRate = async (data) => {
  try {
    console.log(
      "💰 [Food Rate] Saving branch food rate:",
      data
    );

    const response = await api.post(
      "/admin/branch-food-rates",
      data
    );

    console.log(
      "📥 [Food Rate] Save response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Food Rate] Save error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==========================================
// GET BRANCH FOOD RATES
// ==========================================

export const getBranchFoodRates = async (
  branchId
) => {
  try {
    console.log(
      "💰 [Food Rate] Getting rates for branch:",
      branchId
    );

    const response = await api.get(
      `/admin/branch-food-rates/${branchId}`
    );

    console.log(
      "📥 [Food Rate] Get response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Food Rate] Get error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ==========================================
// DELETE BRANCH FOOD RATE OVERRIDE
// ==========================================

export const deleteBranchFoodRate = async (
  branchId,
  foodItemId
) => {
  try {
    console.log(
      "🗑️ [Food Rate] Removing override:",
      {
        branchId,
        foodItemId,
      }
    );

    const response = await api.delete(
      `/admin/branch-food-rates/${branchId}/${foodItemId}`
    );

    console.log(
      "📥 [Food Rate] Delete response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ [Food Rate] Delete error:",
      error.response?.data || error.message
    );

    throw error;
  }
};