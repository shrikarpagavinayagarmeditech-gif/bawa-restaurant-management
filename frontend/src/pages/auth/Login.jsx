import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { loginUser } from "../../controllers/auth.controller";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!username.trim()) {
            setError("Username is required");
            return;
        }

        if (!password) {
            setError("Password is required");
            return;
        }

        try {
            setLoading(true);

            const result = await loginUser(
                username.trim(),
                password
            );

            const role =
                result.data.user.role;

            if (role === "ADMIN") {
                navigate("/admin/dashboard");
            } else if (role === "BRANCH") {
                navigate("/branch/billing");
            } else {
                setError("Invalid user role");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                                <div
                    className="login-header"
                    style={{
                        textAlign: "center",
                        marginBottom: "28px",
                    }}
                >
                    <img
                        src="/images/bawa-logo.png"
                        alt="Bawa Restaurant Logo"
                        style={{
                            width: "250px",
                            height: "200px",
                            objectFit: "contain",
                            display: "block",
                            margin: "0 auto 16px",
                        }}
                    />

                    <h1 style={{ margin: "0 0 8px" }}>
                        Bawa Restaurant
                    </h1>

                    <p style={{ margin: 0 }}>
                        Restaurant Management System
                    </p>
                </div>

                <form onSubmit={handleLogin}>

                    <div className="form-group">
                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter username"
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default Login;