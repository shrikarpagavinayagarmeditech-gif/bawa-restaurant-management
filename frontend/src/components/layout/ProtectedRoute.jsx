import React from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  isAuthenticated,
  getCurrentUser,
} from "../../controllers/auth.controller";


function ProtectedRoute({ allowedRoles }) {

  console.log("=================================");
  console.log("🛡️ PROTECTED ROUTE");
  console.log("=================================");

  const authenticated = isAuthenticated();

  console.log(
    "🔐 Authenticated:",
    authenticated
  );

  if (!authenticated) {

    console.log(
      "❌ Not authenticated → Login"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  const user = getCurrentUser();

  console.log(
    "👤 Protected Route User:",
    user
  );


  if (!user) {

    console.log(
      "❌ User missing from storage"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {

    console.log(
      "❌ Role not allowed:",
      user.role
    );

    if (user.role === "ADMIN") {

      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    if (user.role === "BRANCH") {

      return (
        <Navigate
          to="/branch/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  console.log(
    "✅ Protected route access granted"
  );

  return <Outlet />;
}


export default ProtectedRoute;