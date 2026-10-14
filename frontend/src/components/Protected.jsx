
import { Navigate } from "react-router-dom";
import React from "react";


export default function Protected({ children, admin = false }) {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // User login செய்யவில்லை
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only page-க்கு Branch user வந்தால்
  if (admin && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

