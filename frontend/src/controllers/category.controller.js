import api from "../api/api.js";

export const getCategories = async () => {
  try {
    console.log("=================================");
    console.log("📂 GET CATEGORIES");
    console.log("=================================");

    const response = await api.get("/admin/categories");

    console.log("📥 Categories response:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Get categories error:", error);
    console.error(
      "❌ Backend response:",
      error.response?.data
    );

    throw new Error(
      error.response?.data?.message ||
        "Unable to load categories"
    );
  }
};

export const createCategory = async (name) => {
  try {
    console.log("=================================");
    console.log("➕ CREATE CATEGORY");
    console.log("=================================");

    console.log("📤 Category name:", name);

    const response = await api.post(
      "/admin/categories",
      {
        name,
      }
    );

    console.log(
      "📥 Create response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Create category error:",
      error
    );

    console.error(
      "❌ Backend response:",
      error.response?.data
    );

    throw new Error(
      error.response?.data?.message ||
        "Unable to create category"
    );
  }
};

export const updateCategory = async (
  id,
  data
) => {
  try {
    console.log("=================================");
    console.log("✏️ UPDATE CATEGORY");
    console.log("=================================");

    console.log("🆔 Category ID:", id);
    console.log("📤 Update data:", data);

    const response = await api.put(
      `/admin/categories/${id}`,
      data
    );

    console.log(
      "📥 Update response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Update category error:",
      error
    );

    console.error(
      "❌ Backend response:",
      error.response?.data
    );

    throw new Error(
      error.response?.data?.message ||
        "Unable to update category"
    );
  }
};

export const deleteCategory = async (id) => {
  try {
    console.log("=================================");
    console.log("🗑️ DELETE CATEGORY");
    console.log("=================================");

    console.log("🆔 Category ID:", id);

    const response = await api.delete(
      `/admin/categories/${id}`
    );

    console.log(
      "📥 Delete response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Delete category error:",
      error
    );

    console.error(
      "❌ Backend response:",
      error.response?.data
    );

    throw new Error(
      error.response?.data?.message ||
        "Unable to deactivate category"
    );
  }
};