
import React, { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../../api/api";
import { getBranches } from "../../../controllers/branch.controller";

const getToday = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const OutstandingReport = () => {
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({
    branchId: "",
    from: getToday(),
    to: getToday(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBranches = useCallback(async () => {
    try {
      const response = await getBranches();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setBranches(list);
    } catch (err) {
      console.error("Branch loading error:", err);
    }
  }, []);

  const loadReport = useCallback(async (currentFilters) => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (currentFilters.branchId) {
        params.branchId = currentFilters.branchId;
      }

      if (currentFilters.from) params.from = currentFilters.from;
      if (currentFilters.to) params.to = currentFilters.to;

      const response = await api.get("/admin/reports/branch-wise", {
        params,
      });

      const result = response.data;

      if (result?.success !== true) {
        throw new Error(result?.message || "Unable to load report.");
      }

      setData(Array.isArray(result.data) ? result.data : []);
      setSummary(result.summary || {});
    } catch (err) {
      console.error("Outstanding report error:", err);
      setData([]);
      setSummary({});
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load outstanding report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
    loadReport(filters);
  }, [loadBranches, loadReport]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSearch = () => {
    if (filters.from && filters.to && filters.from > filters.to) {
      setError("From date cannot be later than To date.");
      return;
    }

    loadReport(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      branchId: "",
      from: getToday(),
      to: getToday(),
    };

    setFilters(resetFilters);
    loadReport(resetFilters);
  };

  const handleExportExcel = () => {
    if (!data.length) {
      setError("No report data available to export.");
      return;
    }

    const summaryRows = [
      { Particulars: "Outstanding Report", Value: "" },
      { Particulars: "From Date", Value: filters.from || "All dates" },
      { Particulars: "To Date", Value: filters.to || "All dates" },
      {
        Particulars: "Branch",
        Value:
          branches.find(
            (branch) => String(branch.id) === String(filters.branchId)
          )?.name || "All Branches",
      },
      { Particulars: "Total Branches", Value: summary.totalBranches || 0 },
      { Particulars: "Total Bills", Value: summary.totalBills || 0 },
      { Particulars: "Total Sales", Value: Number(summary.totalSales) || 0 },
      {
        Particulars: "Total Expenses",
        Value: Number(summary.totalExpenses) || 0,
      },
      {
        Particulars: "Outstanding",
        Value: Number(summary.outstanding) || 0,
      },
    ];

    const branchRows = data.map((item, index) => ({
      "S.No": index + 1,
      "Branch": item.branchName || "-",
      "Status": item.active ? "Active" : "Inactive",
      "Total Bills": Number(item.totalBills) || 0,
      "Sales (INR)": Number(item.totalSales) || 0,
      "GST (INR)": Number(item.totalGst) || 0,
      "Cash (INR)": Number(item.cashAmount) || 0,
      "UPI (INR)": Number(item.upiAmount) || 0,
      "Expenses (INR)": Number(item.totalExpenses) || 0,
      "Outstanding (INR)": Number(item.outstanding) || 0,
    }));

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    const detailSheet = XLSX.utils.json_to_sheet(branchRows);

    summarySheet["!cols"] = [{ wch: 24 }, { wch: 25 }];
    detailSheet["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 14 },
      { wch: 13 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 21 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Branch Details");

    XLSX.writeFile(workbook, `Outstanding_Report_${getToday()}.xlsx`);
  };

  return (
    <>
      <style>{`
        .out-page {
          min-height: 100vh;
          padding: 25px;
          background: #f5f7fb;
          color: #1f2937;
          font-family: Inter, Arial, sans-serif;
        }

        .out-page * { box-sizing: border-box; }

        .out-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .out-title h2 {
          margin: 0 0 7px;
          color: #111827;
          font-size: 27px;
          font-weight: 750;
        }

        .out-title p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        .out-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .out-btn {
          min-height: 42px;
          padding: 10px 16px;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
        }

        .out-btn-primary {
          background: #8b1c1c;
          color: white;
        }

        .out-btn-excel {
          background: #15803d;
          color: white;
        }

        .out-btn-light {
          background: white;
          color: #374151;
          border-color: #d1d5db;
        }

        .out-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .out-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .out-card {
          position: relative;
          padding: 21px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 3px 12px rgba(0,0,0,.025);
          overflow: hidden;
        }

        .out-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: #2563eb;
        }

        .out-card.expense::before { background: #dc2626; }
        .out-card.outstanding::before { background: #15803d; }
        .out-card.bills::before { background: #9333ea; }

        .out-card-label {
          margin-bottom: 12px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
        }

        .out-card-value {
          color: #111827;
          font-size: 23px;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .out-card-note {
          margin-top: 9px;
          color: #9ca3af;
          font-size: 11px;
        }

        .out-panel {
          margin-bottom: 22px;
          padding: 22px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 3px 12px rgba(0,0,0,.025);
        }

        .out-panel-heading {
          margin-bottom: 18px;
        }

        .out-panel-heading h3 {
          margin: 0 0 5px;
          color: #111827;
          font-size: 17px;
        }

        .out-panel-heading p {
          margin: 0;
          color: #9ca3af;
          font-size: 12px;
        }

        .out-filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .out-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .out-field label {
          color: #374151;
          font-size: 12px;
          font-weight: 650;
        }

        .out-field input,
        .out-field select {
          width: 100%;
          min-height: 43px;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          outline: none;
          color: #111827;
          font-size: 13px;
        }

        .out-field input:focus,
        .out-field select:focus {
          border-color: #8b1c1c;
          box-shadow: 0 0 0 3px rgba(139,28,28,.08);
        }

        .out-filter-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 19px;
        }

        .out-alert {
          padding: 12px 15px;
          margin-bottom: 17px;
          border-radius: 8px;
          font-size: 13px;
        }

        .out-error {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .out-table-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 17px;
        }

        .out-table-heading h3 {
          margin: 0;
          color: #111827;
          font-size: 17px;
        }

        .out-count {
          padding: 6px 10px;
          border-radius: 20px;
          background: #f3f4f6;
          color: #4b5563;
          font-size: 12px;
          font-weight: 600;
        }

        .out-table-wrap { overflow-x: auto; }

        .out-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .out-table th {
          padding: 14px;
          background: #f9fafb;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          white-space: nowrap;
          font-size: 11px;
          text-transform: uppercase;
        }

        .out-table td {
          padding: 15px 14px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          white-space: nowrap;
        }

        .out-table tbody tr:hover { background: #fafafa; }

        .out-branch {
          color: #111827;
          font-weight: 700;
        }

        .out-sales {
          color: #15803d !important;
          font-weight: 700;
        }

        .out-expenses {
          color: #dc2626 !important;
          font-weight: 700;
        }

        .out-positive {
          color: #15803d !important;
          font-weight: 750;
        }

        .out-negative {
          color: #dc2626 !important;
          font-weight: 750;
        }

        .out-total-row td {
          background: #f9fafb;
          font-weight: 750;
          border-top: 2px solid #e5e7eb;
        }

        .out-empty {
          padding: 40px 15px;
          color: #6b7280;
          text-align: center;
          font-size: 13px;
        }

        .out-summary-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .out-summary-footer span {
          color: #6b7280;
          font-size: 13px;
        }

        .out-summary-footer strong {
          color: #15803d;
          font-size: 19px;
        }

        @media (max-width: 1100px) {
          .out-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .out-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 600px) {
          .out-page { padding: 13px; }
          .out-title h2 { font-size: 23px; }
          .out-actions { width: 100%; }
          .out-actions .out-btn { flex: 1; }
          .out-cards { grid-template-columns: 1fr; gap: 12px; }
          .out-filter-grid { grid-template-columns: 1fr; }
          .out-panel { padding: 15px; }
          .out-filter-actions .out-btn { flex: 1; }
        }
      `}</style>

      <main className="out-page">
        <header className="out-header">
          <div className="out-title">
            <h2>Outstanding Report</h2>
            <p>
              Track branch-wise sales, expenses and outstanding amounts.
            </p>
          </div>

          <div className="out-actions">
            <button
              type="button"
              className="out-btn out-btn-excel"
              onClick={handleExportExcel}
              disabled={loading || data.length === 0}
            >
              ⇩ Download Excel
            </button>

            <button
              type="button"
              className="out-btn out-btn-primary"
              onClick={() => loadReport(filters)}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="out-alert out-error" role="alert">
            {error}
          </div>
        )}

        <section className="out-cards">
          <div className="out-card">
            <div className="out-card-label">Total Sales</div>
            <div className="out-card-value">
              {money(summary.totalSales)}
            </div>
            <div className="out-card-note">
              Completed bills only
            </div>
          </div>

          <div className="out-card expense">
            <div className="out-card-label">Total Expenses</div>
            <div className="out-card-value">
              {money(summary.totalExpenses)}
            </div>
            <div className="out-card-note">
              Recorded expenses
            </div>
          </div>

          <div className="out-card outstanding">
            <div className="out-card-label">Outstanding</div>
            <div className="out-card-value">
              {money(summary.outstanding)}
            </div>
            <div className="out-card-note">
              Sales minus expenses
            </div>
          </div>

          <div className="out-card bills">
            <div className="out-card-label">Total Bills</div>
            <div className="out-card-value">
              {Number(summary.totalBills) || 0}
            </div>
            <div className="out-card-note">
              {Number(summary.totalBranches) || 0} branches in report
            </div>
          </div>
        </section>

        <section className="out-panel">
          <div className="out-panel-heading">
            <h3>Report Filters</h3>
            <p>Select a branch and date range to generate the report.</p>
          </div>

          <div className="out-filter-grid">
            <div className="out-field">
              <label htmlFor="out-branch">Branch</label>
              <select
                id="out-branch"
                name="branchId"
                value={filters.branchId}
                onChange={handleFilterChange}
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="out-field">
              <label htmlFor="out-from">From Date</label>
              <input
                id="out-from"
                type="date"
                name="from"
                value={filters.from}
                max={filters.to || undefined}
                onChange={handleFilterChange}
              />
            </div>

            <div className="out-field">
              <label htmlFor="out-to">To Date</label>
              <input
                id="out-to"
                type="date"
                name="to"
                value={filters.to}
                min={filters.from || undefined}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="out-filter-actions">
            <button
              type="button"
              className="out-btn out-btn-light"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>

            <button
              type="button"
              className="out-btn out-btn-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>
        </section>

        <section className="out-panel">
          <div className="out-table-heading">
            <div>
              <h3>Branch-wise Outstanding</h3>
              <p style={{ margin: "6px 0 0", color: "#9ca3af", fontSize: 12 }}>
                Outstanding = Sales − Expenses
              </p>
            </div>

            <span className="out-count">
              {data.length} branches
            </span>
          </div>

          {loading ? (
            <div className="out-empty">Loading report...</div>
          ) : data.length === 0 ? (
            <div className="out-empty">
              No report data found for the selected filters.
            </div>
          ) : (
            <div className="out-table-wrap">
              <table className="out-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Branch</th>
                    <th>Bills</th>
                    <th>Sales</th>
                    <th>Expenses</th>
                    <th>Outstanding</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item, index) => (
                    <tr key={item.branchId}>
                      <td>{index + 1}</td>
                      <td className="out-branch">
                        {item.branchName || "-"}
                      </td>
                      <td>{Number(item.totalBills) || 0}</td>
                      <td className="out-sales">
                        {money(item.totalSales)}
                      </td>
                      <td className="out-expenses">
                        {money(item.totalExpenses)}
                      </td>
                      <td
                        className={
                          Number(item.outstanding) < 0
                            ? "out-negative"
                            : "out-positive"
                        }
                      >
                        {money(item.outstanding)}
                      </td>
                    </tr>
                  ))}

                  <tr className="out-total-row">
                    <td colSpan={2}>Grand Total</td>
                    <td>{Number(summary.totalBills) || 0}</td>
                    <td className="out-sales">
                      {money(summary.totalSales)}
                    </td>
                    <td className="out-expenses">
                      {money(summary.totalExpenses)}
                    </td>
                    <td
                      className={
                        Number(summary.outstanding) < 0
                          ? "out-negative"
                          : "out-positive"
                      }
                    >
                      {money(summary.outstanding)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="out-summary-footer">
            <span>
              Report period: {filters.from || "Start"} to{" "}
              {filters.to || "Today"}
            </span>

            <div>
              <span style={{ marginRight: 10 }}>Net outstanding</span>
              <strong>{money(summary.outstanding)}</strong>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default OutstandingReport;
