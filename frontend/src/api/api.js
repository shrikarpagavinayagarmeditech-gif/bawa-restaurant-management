import axios from "axios";

console.log("=================================");
console.log("🚀 API FILE LOADED");
console.log("🌐 API Base URL:", "http://localhost:5000/api");
console.log("=================================");

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ================================
// REQUEST INTERCEPTOR
// ================================
api.interceptors.request.use(
  (config) => {
    console.log("");
    console.log("=================================");
    console.log("📤 AXIOS REQUEST START");
    console.log("=================================");

    console.log("➡️ Method:", config.method?.toUpperCase());
    console.log("➡️ URL:", `${config.baseURL}${config.url}`);
    console.log("➡️ Request Data:", config.data);
    console.log("➡️ Request Headers:", config.headers);

    const token = localStorage.getItem("token");

    console.log(
      "🔑 Token exists:",
      token ? "YES" : "NO"
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      console.log("🔐 Authorization header added");
    }

    console.log("📤 Sending request to backend...");

    return config;
  },
  (error) => {
    console.error("");
    console.error("❌ AXIOS REQUEST INTERCEPTOR ERROR");
    console.error(error);

    return Promise.reject(error);
  }
);

// ================================
// RESPONSE INTERCEPTOR
// ================================
api.interceptors.response.use(
  (response) => {
    console.log("");
    console.log("=================================");
    console.log("📥 AXIOS RESPONSE SUCCESS");
    console.log("=================================");

    console.log("✅ Status:", response.status);
    console.log("✅ URL:", response.config?.url);
    console.log("✅ Response Data:", response.data);

    return response;
  },
  (error) => {
    console.error("");
    console.error("=================================");
    console.error("❌ AXIOS RESPONSE ERROR");
    console.error("=================================");

    console.error("❌ Error Message:", error.message);
    console.error("❌ Error Code:", error.code);
    console.error("❌ Error Name:", error.name);

    console.error(
      "❌ Request URL:",
      error.config
        ? `${error.config.baseURL}${error.config.url}`
        : "No config"
    );

    console.error(
      "❌ Request Method:",
      error.config?.method?.toUpperCase()
    );

    console.error(
      "❌ Request Data:",
      error.config?.data
    );

    console.error(
      "❌ Response Status:",
      error.response?.status || "NO RESPONSE"
    );

    console.error(
      "❌ Response Data:",
      error.response?.data || "NO RESPONSE DATA"
    );

    console.error(
      "❌ Full Axios Error:",
      error
    );

    // 401 handling
    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized");
      console.warn("🧹 Clearing login storage...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      console.warn("🔄 Redirecting to /login");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;