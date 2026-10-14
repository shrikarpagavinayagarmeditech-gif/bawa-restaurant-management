import React from "react";
import { NavLink } from "react-router-dom";
import { logoutUser } from "../../controllers/auth.controller";

function Sidebar({ isOpen, onClose }) {

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const role = user?.role;

  console.log("👤 Sidebar user:", user);
  console.log("🔐 Sidebar role:", role);

  const adminMenuItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "▦",
    },
    {
      label: "Branches",
      path: "/admin/branches",
      icon: "⌂",
    },
    {
      label: "Categories",
      path: "/admin/categories",
      icon: "▤",
    },
    {
      label: "Shifts",
      path: "/admin/shifts",
      icon: "◷",
    },
    {
      label: "Food Items",
      path: "/admin/food-items",
      icon: "▣",
    },
    {
      label: "Food Rates",
      path: "/admin/rates",
      icon: "₹",
    },
    {
      label: "Orders",
      path: "/admin/orders",
      icon: "🧾",
    },
    {
      label: "Expenses",
      path: "/admin/expenses",
      icon: "−",
    },
    {
      label: "Reports",
      path: "/admin/reports",
      icon: "▥",
    },
  ];

  const branchMenuItems = [
    {
      label: "Dashboard",
      path: "/branch/dashboard",
      icon: "▦",
    },
    {
      label: "Billing",
      path: "/branch/billing",
      icon: "▣",
    },
    {
      label: "Orders",
      path: "/branch/orders",
      icon: "🧾",
    },
  ];

  const menuItems =
    role === "ADMIN"
      ? adminMenuItems
      : role === "BRANCH"
        ? branchMenuItems
        : [];

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >

        {/* Logo */}
                {/* Logo */}
        <div
          className="sidebar-brand"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "30px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <img
            src="/images/bawa-logo.png"
            alt="Bawa Restaurant Logo"
            style={{
              width: "200px",
              height: "89px",
              objectFit: "contain",
              flexShrink: 0,
              borderRadius: "8px",
            }}
          />

          {/* <div style={{ flex: 1, minWidth: 0 }}>
            <strong
              style={{
                display: "block",
                fontSize: "13px",
                lineHeight: 1.5,
                overflowWrap: "anywhere",
              }}
            >
              Restaurant Management
            </strong>
          </div> */}

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* Menu */}
        <nav className="sidebar-menu">

          <p className="menu-title">
            MAIN MENU
          </p>

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </NavLink>
          ))}

        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">

          <button
            className="logout-button"
            onClick={logoutUser}
          >
            <span className="sidebar-icon">
              ⇥
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;