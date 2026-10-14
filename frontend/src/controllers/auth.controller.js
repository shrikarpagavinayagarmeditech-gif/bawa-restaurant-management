import api from "../api/api.js";
import { storage } from "../utils/storage";

console.log("=================================");
console.log("🔐 AUTH CONTROLLER LOADED");
console.log("=================================");

// ================================
// LOGIN
// ================================
export const loginUser = async (username, password) => {
  console.log("");
  console.log("=================================");
  console.log("🔐 LOGIN USER START");
  console.log("=================================");

  console.log("👤 Username:", username);

  console.log(
    "🔑 Password received:",
    password ? "YES" : "NO"
  );

  console.log(
    "🔑 Password length:",
    password?.length || 0
  );

  try {
    console.log("");
    console.log("📡 Calling API...");
    console.log("➡️ Endpoint: POST /auth/login");

    const requestBody = {
      username,
      password,
    };

    console.log("➡️ Request Body:", {
      username,
      password: password ? "********" : "",
    });

    const response = await api.post(
      "/auth/login",
      requestBody
    );

    console.log("");
    console.log("✅ API CALL COMPLETED");

    console.log("📥 HTTP Status:", response.status);
    console.log("📥 Response:", response.data);

    const result = response.data;

    // ================================
    // CHECK SUCCESS
    // ================================

    console.log("");
    console.log("🔍 Checking API success...");

    if (!result.success) {
      console.error(
        "❌ API returned success=false"
      );

      console.error(
        "❌ API message:",
        result.message
      );

      throw new Error(
        result.message || "Login failed"
      );
    }

    console.log("✅ API success=true");

    // ================================
    // CHECK TOKEN
    // ================================

    console.log("");
    console.log("🔍 Checking token...");

    if (!result.data?.token) {
      console.error(
        "❌ Token missing from response"
      );

      console.error(
        "❌ Response data:",
        result.data
      );

      throw new Error(
        "Login successful but token was not received"
      );
    }

    console.log("✅ Token received");
    console.log(
      "🔑 Token length:",
      result.data.token.length
    );

    // ================================
    // CHECK USER
    // ================================

    console.log("");
    console.log("🔍 Checking user data...");

    if (!result.data?.user) {
      console.error(
        "❌ User data missing from response"
      );

      throw new Error(
        "Login successful but user data was not received"
      );
    }

    console.log("✅ User received");
    console.log("👤 User:", result.data.user);

    // ================================
    // SAVE TOKEN
    // ================================

    console.log("");
    console.log("💾 Saving token...");

    storage.setToken(result.data.token);

    console.log("✅ Token saved");

    // ================================
    // SAVE USER
    // ================================

    console.log("");
    console.log("💾 Saving user...");

    storage.setUser(result.data.user);

    console.log("✅ User saved");

    // ================================
    // VERIFY STORAGE
    // ================================

    console.log("");
    console.log("🔍 Verifying localStorage...");

    const savedToken = storage.getToken();
    const savedUser = storage.getUser();

    console.log(
      "🔑 Saved token exists:",
      savedToken ? "YES" : "NO"
    );

    console.log(
      "👤 Saved user:",
      savedUser
    );

    console.log("");
    console.log("=================================");
    console.log("🎉 LOGIN USER SUCCESS");
    console.log("=================================");

    return result;
  } catch (error) {
    console.error("");
    console.error("=================================");
    console.error("💥 LOGIN USER FAILED");
    console.error("=================================");

    console.error(
      "❌ Error message:",
      error.message
    );

    console.error(
      "❌ Error name:",
      error.name
    );

    console.error(
      "❌ Error code:",
      error.code
    );

    console.error(
      "❌ HTTP status:",
      error.response?.status || "NO RESPONSE"
    );

    console.error(
      "❌ Backend response:",
      error.response?.data || "NO BACKEND RESPONSE"
    );

    console.error(
      "❌ Request URL:",
      error.config
        ? `${error.config.baseURL}${error.config.url}`
        : "NO REQUEST URL"
    );

    console.error(
      "❌ Full error:",
      error
    );

    console.error("=================================");

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to login"
    );
  }
};

// ================================
// LOGOUT
// ================================
export const logoutUser = () => {
  console.log("");
  console.log("🚪 LOGOUT START");

  storage.clear();

  console.log("🧹 Storage cleared");
  console.log("🔄 Redirecting to login");

  window.location.href = "/login";
};

// ================================
// CURRENT USER
// ================================
export const getCurrentUser = () => {
  console.log("👤 Getting current user...");

  const user = storage.getUser();

  console.log("👤 Current user:", user);

  return user;
};

// ================================
// AUTH CHECK
// ================================
export const isAuthenticated = () => {
  const token = storage.getToken();

  console.log(
    "🔐 Authentication check:",
    token ? "AUTHENTICATED" : "NOT AUTHENTICATED"
  );

  return Boolean(token);
};