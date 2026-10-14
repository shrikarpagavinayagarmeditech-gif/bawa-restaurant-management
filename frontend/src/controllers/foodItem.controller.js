import api from "../api/api.js";


// =========================================
// GET FOOD ITEMS
// =========================================

export const getFoodItems = async () => {
    try {

        console.log("📡 Fetching food items...");

        const response = await api.get(
            "/admin/food-items"
        );

        console.log(
            "✅ Food items response:",
            response.data
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Get food items error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


// =========================================
// GET FOOD ITEM BY ID
// =========================================

export const getFoodItemById = async (id) => {
    try {

        const response = await api.get(
            `/admin/food-items/${id}`
        );

        return response.data;

    } catch (error) {

        console.error(
            "❌ Get food item error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


// =========================================
// CREATE FOOD ITEM
// =========================================

export const createFoodItem = async (foodItemData) => {
    try {

        console.log(
            "📤 CREATE FOOD ITEM REQUEST"
        );

        console.log(
            "📦 Is FormData:",
            foodItemData instanceof FormData
        );


        const response = await api.post(
            "/admin/food-items",
            foodItemData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );


        console.log(
            "✅ Create response:",
            response.data
        );


        return response.data;

    } catch (error) {

        console.error(
            "❌ Create food item error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


// =========================================
// UPDATE FOOD ITEM
// =========================================

export const updateFoodItem = async (
    id,
    foodItemData
) => {
    try {

        console.log(
            "📤 UPDATE FOOD ITEM REQUEST"
        );

        console.log(
            "🆔 ID:",
            id
        );

        console.log(
            "📦 Is FormData:",
            foodItemData instanceof FormData
        );


        const response = await api.put(
            `/admin/food-items/${id}`,
            foodItemData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );


        console.log(
            "✅ Update response:",
            response.data
        );


        return response.data;

    } catch (error) {

        console.error(
            "❌ Update food item error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


// =========================================
// DELETE FOOD ITEM
// =========================================

export const deleteFoodItem = async (id) => {
    try {

        console.log(
            "🗑️ Deleting food item:",
            id
        );


        const response = await api.delete(
            `/admin/food-items/${id}`
        );


        console.log(
            "✅ Delete response:",
            response.data
        );


        return response.data;

    } catch (error) {

        console.error(
            "❌ Delete food item error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};