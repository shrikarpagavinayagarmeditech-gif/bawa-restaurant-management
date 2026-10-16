
import axios from "axios";

export const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "https://bawa.quiltoaiapps.com/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const money = (n) => {
    return `₹${Number(n || 0).toFixed(2)}`;
};

