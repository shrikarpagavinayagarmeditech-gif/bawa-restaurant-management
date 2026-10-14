export const storage = {
    setToken(token) {
        localStorage.setItem("token", token);
    },

    getToken() {
        return localStorage.getItem("token");
    },

    removeToken() {
        localStorage.removeItem("token");
    },

    setUser(user) {
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );
    },

    getUser() {
        const user = localStorage.getItem("user");

        if (!user) {
            return null;
        }

        try {
            return JSON.parse(user);
        } catch (error) {
            return null;
        }
    },

    removeUser() {
        localStorage.removeItem("user");
    },

    clear() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },
};