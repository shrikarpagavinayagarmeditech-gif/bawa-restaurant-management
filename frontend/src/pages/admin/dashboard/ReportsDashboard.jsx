import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReportDashboard } from "../../../controllers/report.controller";
import "./ReportsDashboard.css";

const AdminDashboard = () => {
    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigate = useNavigate();

    // =====================================================
    // STATE
    // =====================================================

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    const loadDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await getReportDashboard();

            console.log("REPORT DASHBOARD RESPONSE:", response);

            if (response?.success) {
                setData(response);
            } else {
                setError(
                    response?.message || "Failed to load report dashboard"
                );
            }
        } catch (err) {
            console.error("REPORT DASHBOARD ERROR:", err);

            setError(
                err?.response?.data?.message ||
                "Unable to load report dashboard"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadDashboard();
    }, []);

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // =====================================================
    // FORMAT NUMBER
    // =====================================================

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString("en-IN");
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="reports-page">
                <div className="reports-loading">
                    <div className="reports-spinner"></div>

                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <div className="reports-page">
                <div className="reports-error">
                    <div className="reports-error-icon">!</div>

                    <h3>Unable to Load Reports</h3>

                    <p>{error}</p>

                    <button
                        className="reports-retry-btn"
                        onClick={() => loadDashboard()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // =====================================================
    // DATA
    // =====================================================

    const summary = data?.summary || {};

    const branches = data?.branches || [];

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="reports-page">

            {/* =====================================================
          HEADER
      ====================================================== */}

            <div className="reports-header">

                <div>
                    <div className="reports-title-row">

                        <div className="reports-title-icon">
                            📊
                        </div>

                        <div>
                            <h1>
                                Reports Dashboard
                            </h1>

                            <p>
                                Today's sales, collections, expenses and
                                branch performance
                            </p>
                        </div>

                    </div>
                </div>


                <div className="reports-header-actions">

                    <div className="reports-date">
                        📅{" "}
                        {data?.date
                            ? new Date(data.date).toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }
                            )
                            : "-"}
                    </div>


                    <button
                        className="reports-refresh-btn"
                        onClick={() => loadDashboard(true)}
                        disabled={refreshing}
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

            </div>


            {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

            <div className="reports-summary-grid">

                {/* ================= BILLS ================= */}

                <div className="report-card bills-card">

                    <div className="report-card-top">

                        <div className="report-card-icon">
                            🧾
                        </div>

                        <span className="report-card-label">
                            Today's Bills
                        </span>

                    </div>

                    <div className="report-card-value">
                        {formatNumber(summary.bills)}
                    </div>

                    <div className="report-card-subtext">
                        Completed bills
                    </div>

                </div>


                {/* ================= SALES ================= */}

                <div className="report-card sales-card">

                    <div className="report-card-top">

                        <div className="report-card-icon">
                            💰
                        </div>

                        <span className="report-card-label">
                            Today's Sales
                        </span>

                    </div>

                    <div className="report-card-value">
                        {formatCurrency(summary.sales)}
                    </div>

                    <div className="report-card-subtext">
                        Total completed sales
                    </div>

                </div>


                {/* ================= CASH ================= */}

                <div className="report-card cash-card">

                    <div className="report-card-top">

                        <div className="report-card-icon">
                            💵
                        </div>

                        <span className="report-card-label">
                            Cash Collection
                        </span>

                    </div>

                    <div className="report-card-value">
                        {formatCurrency(summary.cash)}
                    </div>

                    <div className="report-card-subtext">
                        Cash payments
                    </div>

                </div>


                {/* ================= UPI ================= */}

                <div className="report-card upi-card">

                    <div className="report-card-top">

                        <div className="report-card-icon">
                            📱
                        </div>

                        <span className="report-card-label">
                            UPI Collection
                        </span>

                    </div>

                    <div className="report-card-value">
                        {formatCurrency(summary.upi)}
                    </div>

                    <div className="report-card-subtext">
                        UPI payments
                    </div>

                </div>


                {/* ================= EXPENSE ================= */}

                <div className="report-card expense-card">

                    <div className="report-card-top">

                        <div className="report-card-icon">
                            📤
                        </div>

                        <span className="report-card-label">
                            Today's Expenses
                        </span>

                    </div>

                    <div className="report-card-value">
                        {formatCurrency(summary.expenses)}
                    </div>

                    <div className="report-card-subtext">
                        Total expenses
                    </div>

                </div>


                {/* ================= OUTSTANDING ================= */}

                <div className="report-card outstanding-card">

                    <div className="report-card-top">

                        <div className="report-card-icon">
                            📈
                        </div>

                        <span className="report-card-label">
                            Outstanding
                        </span>

                    </div>

                    <div className="report-card-value">
                        {formatCurrency(summary.outstanding)}
                    </div>

                    <div className="report-card-subtext">
                        Sales − Expenses
                    </div>

                </div>

            </div>


            {/* =====================================================
          ADDITIONAL SUMMARY
      ====================================================== */}

            <div className="reports-secondary-grid">

                {/* SUBTOTAL */}

                <div className="secondary-summary-card">

                    <div className="secondary-icon">
                        🧮
                    </div>

                    <div>
                        <span>
                            Subtotal
                        </span>

                        <strong>
                            {formatCurrency(summary.subtotal)}
                        </strong>
                    </div>

                </div>


                {/* GST */}

                <div className="secondary-summary-card">

                    <div className="secondary-icon">
                        🧾
                    </div>

                    <div>
                        <span>
                            GST / Tax
                        </span>

                        <strong>
                            {formatCurrency(summary.tax)}
                        </strong>
                    </div>

                </div>


                {/* BRANCHES */}

                <div className="secondary-summary-card">

                    <div className="secondary-icon">
                        🏪
                    </div>

                    <div>
                        <span>
                            Total Branches
                        </span>

                        <strong>
                            {branches.length}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =====================================================
          BRANCH PERFORMANCE
      ====================================================== */}

            <div className="reports-section">

                <div className="reports-section-header">

                    <div>

                        <h2>
                            Branch Performance
                        </h2>

                        <p>
                            Today's branch-wise sales and outstanding
                            summary
                        </p>

                    </div>


                    <span className="branch-count">
                        {branches.length} Branch
                        {branches.length !== 1 ? "es" : ""}
                    </span>

                </div>


                {/* ================= NO BRANCH ================= */}

                {branches.length === 0 ? (

                    <div className="empty-branches">

                        <div>
                            🏪
                        </div>

                        <h3>
                            No Active Branches
                        </h3>

                        <p>
                            There are no active branches available
                            for today's report.
                        </p>

                    </div>

                ) : (

                    <div className="branch-table-wrapper">

                        <table className="branch-report-table">

                            <thead>

                                <tr>

                                    <th>#</th>

                                    <th>
                                        Branch
                                    </th>

                                    <th>
                                        Bills
                                    </th>

                                    <th>
                                        Sales
                                    </th>

                                    <th>
                                        Cash
                                    </th>

                                    <th>
                                        UPI
                                    </th>

                                    <th>
                                        Expenses
                                    </th>

                                    <th>
                                        Outstanding
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {branches.map(
                                    (branch, index) => (

                                        <tr
                                            key={branch.branchId}
                                        >

                                            <td>

                                                <span className="branch-number">
                                                    {index + 1}
                                                </span>

                                            </td>


                                            <td>

                                                <div className="branch-name-cell">

                                                    <div className="branch-avatar">

                                                        {branch.branchName
                                                            ?.charAt(0)
                                                            ?.toUpperCase() || "B"}

                                                    </div>


                                                    <div>

                                                        <strong>
                                                            {branch.branchName}
                                                        </strong>

                                                        <small>
                                                            Active Branch
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="bills-value">
                                                    {formatNumber(
                                                        branch.bills
                                                    )}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="sales-value">
                                                    {formatCurrency(
                                                        branch.sales
                                                    )}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="cash-value">
                                                    {formatCurrency(
                                                        branch.cash
                                                    )}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="upi-value">
                                                    {formatCurrency(
                                                        branch.upi
                                                    )}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="expense-value">
                                                    {formatCurrency(
                                                        branch.expenses
                                                    )}
                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        Number(
                                                            branch.outstanding
                                                        ) >= 0
                                                            ? "outstanding-value positive"
                                                            : "outstanding-value negative"
                                                    }
                                                >
                                                    {formatCurrency(
                                                        branch.outstanding
                                                    )}
                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =====================================================
          DETAILED REPORTS
      ====================================================== */}

            <div className="reports-section">

                <div className="reports-section-header">

                    <div>

                        <h2>
                            Detailed Reports
                        </h2>

                        <p>
                            Open detailed reports for sales,
                            expenses and branches
                        </p>

                    </div>

                </div>


                <div className="report-modules-grid">

                    {/* =================================================
    FOOD-WISE
================================================= */}

                    <div
                        className="report-module-card report-module-clickable"
                        onClick={() =>
                            navigate("/admin/reports/food-wise")
                        }
                    >
                        <div className="module-icon">
                            🍛
                        </div>

                        <div>
                            <h3>
                                Food-wise Sales
                            </h3>

                            <p>
                                Sales by individual food item
                            </p>
                        </div>

                        <span>
                            →
                        </span>
                    </div>


                    {/* =================================================
    SHIFT-WISE
================================================= */}

                    <div
                        className="report-module-card report-module-clickable"
                        onClick={() =>
                            navigate("/admin/reports/shift-wise")
                        }
                    >
                        <div className="module-icon">
                            🕐
                        </div>

                        <div>
                            <h3>
                                Shift-wise Report
                            </h3>

                            <p>
                                Sales by working shift
                            </p>
                        </div>

                        <span>
                            →
                        </span>
                    </div>


                    {/* =================================================
    DAY-WISE
================================================= */}

                    <div
                        className="report-module-card report-module-clickable"
                        onClick={() =>
                            navigate("/admin/reports/day-wise")
                        }
                    >

                        <div className="module-icon">
                            📅
                        </div>

                        <div>

                            <h3>
                                Day-wise Report
                            </h3>

                            <p>
                                Selected day or date range
                            </p>

                        </div>

                        <span>
                            →
                        </span>

                    </div>


                    <div
                        className="report-module-card report-module-clickable"
                        onClick={() => navigate("/admin/reports/gst-wise")}
                    >
                        <div className="module-icon">
                            🧾
                        </div>

                        <div>
                            <h3>GST-wise Report</h3>
                            <p>GST collected and tax breakdown</p>
                        </div>

                        <span>→</span>
                    </div>


                    {/* =================================================
              BRANCH-WISE
          ================================================= */}


                    <div
                        className="report-module-card report-module-clickable"
                        onClick={() => navigate("/admin/reports/branch-wise")}
                    >
                        <div className="module-icon">🏪</div>

                        <div>
                            <h3>Branch-wise Report</h3>
                            <p>Individual branch sales, GST and expenses</p>
                        </div>

                        <span>→</span>
                    </div>




                    {/* =================================================
    BRANCH COMPARISON
================================================= */}

                 
<div
  className="report-module-card report-module-clickable"
  onClick={() => navigate("/admin/reports/branch-comparison")}
>
  <div className="module-icon">📊</div>

  <div>
    <h3>Branch Comparison</h3>
    <p>Compare sales, collections and expenses across branches</p>
  </div>

  <span>→</span>
</div>




                    {/* =================================================
              EXPENSE
          ================================================= */}

                    <div
                        className="report-module-card"
                    >

                        <div className="module-icon">
                            💸
                        </div>

                        <div>

                            <h3>
                                Expense Report
                            </h3>

                            <p>
                                Category and date-wise expenses
                            </p>

                        </div>

                        <span>
                            →
                        </span>

                    </div>


                   {/* =================================================
                        OUTSTANDING REPORT
                    ================================================= */}

                    <div
                        className="report-module-card report-module-clickable"
                        onClick={() => navigate("/admin/outstanding-report")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate("/admin/outstanding-report");
                            }
                        }}
                    >
                        <div className="module-icon">📈</div>

                        <div>
                            <h3>Outstanding Report</h3>
                            <p>Sales minus expenses</p>
                        </div>

                        <span>→</span>
                    </div>

                </div>
                {/* END report-modules-grid */}

            </div>
            {/* END reports-section (Detailed Reports) */}

        </div>
    );
};

export default AdminDashboard;