import { Link, useNavigate } from "react-router-dom";
import React from "react";

export default function Layout({ children }) {
  const nav = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const admin = user?.role === "ADMIN";

  const logout = () => {
    localStorage.clear();
    nav("/login");
  };

  return (
    <div className="app">

      {/* Sidebar */}
      <aside>
        <h2>Bawa Restaurant</h2>

        <small>
          {admin ? "Admin" : "Branch"} Portal
        </small>

        <nav>
          <Link to="/">
            Dashboard
          </Link>

          {admin && (
            <>
              <Link to="/branches">
                Branches
              </Link>

              <Link to="/categories">
                Categories
              </Link>

              <Link to="/shifts">
                Shifts
              </Link>

              <Link to="/food">
                Food Items
              </Link>

              <Link to="/reports">
                Reports
              </Link>
            </>
          )}

          <Link to="/billing">
            Billing
          </Link>

          <Link to="/expenses">
            Expenses
          </Link>
        </nav>

        <button onClick={logout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main>
        <header>
          <b>
            {user?.branch?.name || "All Branches"}
          </b>
        </header>

        {children}
      </main>

    </div>
  );
}
