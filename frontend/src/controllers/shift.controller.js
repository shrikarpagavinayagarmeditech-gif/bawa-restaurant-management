import api from "../api/api.js";

export const getShifts = async () => {
  try {
    console.log("📡 Fetching shifts...");

    const response = await api.get("/admin/shifts");

    console.log("✅ Shifts response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get shifts error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export const createShift = async (shiftData) => {
  try {
    console.log("📤 Creating shift:", shiftData);

    const response = await api.post(
      "/admin/shifts",
      shiftData
    );

    console.log("✅ Shift created:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Create shift error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export const updateShift = async (id, shiftData) => {
  try {
    console.log("📤 Updating shift:", id, shiftData);

    const response = await api.put(
      `/admin/shifts/${id}`,
      shiftData
    );

    console.log("✅ Shift updated:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Update shift error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export const deleteShift = async (id) => {
  try {
    console.log("🗑️ Deleting shift:", id);

    const response = await api.delete(
      `/admin/shifts/${id}`
    );

    console.log("✅ Shift deleted:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Delete shift error:",
      error.response?.data || error.message
    );

    throw error;
  }
};