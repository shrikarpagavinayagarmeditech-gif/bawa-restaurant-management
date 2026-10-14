import React from "react";
import { getCurrentUser } from "../../controllers/auth.controller";

function Header({ onMenuClick }) {
  const user = getCurrentUser();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div className="header-brand">
          {/* <div className="header-logo">B</div> */}

          <div>
            {/* <h1 className="header-title">
              Bawa
            </h1> */}

            <p className="header-subtitle">
              Restaurant Management
            </p>
          </div>
        </div>
      </div>

      {/* <div className="header-center">
        <span className="branch-status">
          ● Active Shift
        </span>

        <span className="branch-status held">
          ▣ Held Bills
        </span>
      </div> */}

      <div className="header-right">
        <div className="header-user">
          <div className="user-info">
            <strong>
              {user?.username || "Branch"}
            </strong>

            <span>
              BRANCH
            </span>
          </div>

          <div className="user-avatar">
            {user?.username
              ?.charAt(0)
              ?.toUpperCase() || "B"}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;