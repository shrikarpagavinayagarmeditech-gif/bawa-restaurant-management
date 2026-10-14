import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main app-main-with-sidebar">

        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="page-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}

export default AppLayout;