import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// =====================================================
// ADMIN PAGES
// =====================================================

import ReportsDashboard from "./pages/admin/dashboard/ReportsDashboard";

import FoodWiseReport from "./pages/admin/reports/FoodWiseReport";

import ShiftWiseReport from "./pages/admin/reports/ShiftWiseReport";

import DayWiseReport from "./pages/admin/reports/DayWiseReport";

import FoodRateList from "./pages/admin/food-rates/FoodRateList";

import OrderList from "./pages/admin/orders/OrderList";
import OrderDetails from "./pages/admin/orders/OrderDetails";

import ExpenseList from "./pages/admin/expenses/ExpenseList";

import Categories from "./pages/admin/categories/Categories";

import Branches from "./pages/branch/Branches.jsx";

import Shifts from "./pages/admin/shifts/Shifts";

import FoodItems from "./pages/admin/food-items/FoodItems";

import GSTWiseReport from "./pages/admin/reports/GSTWiseReport";

import BranchWiseReport from "./pages/admin/reports/BranchWiseReport";

import BranchComparisonReport from "./pages/admin/reports/BranchComparison";

import OutstandingReport from "./pages/admin/reports/OutstandingReport";
// =====================================================
// BRANCH PAGES
// =====================================================

import Billing from "./pages/branch/Billing";

import BranchOrderList from "./pages/branch/orders/OrderList";

import BranchOrderDetails from "./pages/branch/orders/OrderDetails";

// =====================================================
// BRANCH DASHBOARD
// =====================================================

function BranchDashboard() {
  return (
    <div>
      <h2>Branch Dashboard</h2>

      <p>
        Welcome to your branch.
      </p>
    </div>
  );
}

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =================================================
            ADMIN ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            />
          }
        >

          <Route element={<AppLayout />}>

            {/* =================================================
                ADMIN DASHBOARD
            ================================================= */}

            <Route
              path="/admin/dashboard"
              element={
                <ReportsDashboard />
              }
            />


            {/* =================================================
                BRANCHES
            ================================================= */}

            <Route
              path="/admin/branches"
              element={
                <Branches />
              }
            />


            {/* =================================================
                CATEGORIES
            ================================================= */}

            <Route
              path="/admin/categories"
              element={
                <Categories />
              }
            />


            {/* =================================================
                ADMIN BILLING
            ================================================= */}

            <Route
              path="/admin/billing"
              element={
                <Billing />
              }
            />


            {/* =================================================
                SHIFTS
            ================================================= */}

            <Route
              path="/admin/shifts"
              element={
                <Shifts />
              }
            />


            {/* =================================================
                FOOD ITEMS
            ================================================= */}

            <Route
              path="/admin/food-items"
              element={
                <FoodItems />
              }
            />


            {/* =================================================
                ADMIN ORDERS
            ================================================= */}

            <Route
              path="/admin/orders"
              element={
                <OrderList />
              }
            />


            {/* =================================================
                ADMIN ORDER DETAILS
            ================================================= */}

            <Route
              path="/admin/orders/:id"
              element={
                <OrderDetails />
              }
            />


            {/* =================================================
                FOOD RATES
            ================================================= */}

            <Route
              path="/admin/rates"
              element={
                <FoodRateList />
              }
            />


            {/* =================================================
                EXPENSES
            ================================================= */}

            <Route
              path="/admin/expenses"
              element={
                <ExpenseList />
              }
            />


            {/* =================================================
                REPORTS DASHBOARD
            ================================================= */}

            <Route
              path="/admin/reports"
              element={
                <ReportsDashboard />
              }
            />


            {/* =================================================
                FOOD-WISE REPORT
            ================================================= */}

            <Route
              path="/admin/reports/food-wise"
              element={
                <FoodWiseReport />
              }
            />


            {/* =================================================
                SHIFT-WISE REPORT
            ================================================= */}

            <Route
              path="/admin/reports/shift-wise"
              element={
                <ShiftWiseReport />
              }
            />


            {/* =================================================
                DAY-WISE REPORT
            ================================================= */}

            <Route
              path="/admin/reports/day-wise"
              element={
                <DayWiseReport />
              }
            />

            <Route
              path="/admin/reports/gst-wise"
              element={<GSTWiseReport />}
            />

            <Route
              path="/admin/reports/branch-wise"
              element={<BranchWiseReport />}
            />


          <Route
  path="/admin/reports/branch-comparison"
  element={<BranchComparisonReport />}
/>


<Route
  path="/admin/outstanding-report"
  element={<OutstandingReport />}
/>

          </Route>

        </Route>


        {/* =================================================
            BRANCH ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["BRANCH"]}
            />
          }
        >

          <Route element={<AppLayout />}>

            {/* =================================================
                BRANCH DASHBOARD
            ================================================= */}

            <Route
              path="/branch/dashboard"
              element={
                <BranchDashboard />
              }
            />


            {/* =================================================
                BRANCH BILLING
            ================================================= */}

            <Route
              path="/branch/billing"
              element={
                <Billing />
              }
            />


            {/* =================================================
                BRANCH ORDERS
            ================================================= */}

            <Route
              path="/branch/orders"
              element={
                <BranchOrderList />
              }
            />


            {/* =================================================
                BRANCH ORDER DETAILS
            ================================================= */}

            <Route
              path="/branch/orders/:id"
              element={
                <BranchOrderDetails />
              }
            />

          </Route>

        </Route>


        {/* =================================================
            DEFAULT ROUTE
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;