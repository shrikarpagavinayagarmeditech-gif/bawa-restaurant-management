import React, { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getBranchWiseReport } from "../../../controllers/report.controller";
import { getBranches } from "../../../controllers/branch.controller";
import "./Reports.css";

const initialSummary = {
  totalBranches: 0,
  totalBills: 0,
  totalSales: 0,
  totalGst: 0,
  cashAmount: 0,
  upiAmount: 0,
  totalExpenses: 0,
  outstanding: 0,
};

const initialAppliedFilters = {
  branchId: "",
  from: "",
  to: "",
};

const BranchWiseReport = () => {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(initialSummary);

  // Filters used to load the data currently on screen. The Excel file uses
  // these so it always matches the table, even if the inputs were changed
  // but "Apply Filters" hasn't been clicked yet.
  const [appliedFilters, setAppliedFilters] = useState(
    initialAppliedFilters
  );

  const [loading, setLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const loadBranches = useCallback(async () => {
    try {
      setBranchLoading(true);

      const response = await getBranches();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.branches)
            ? response.branches
            : [];

      setBranches(list);
    } catch (err) {
      console.error("BRANCH LIST ERROR:", err);
      setBranches([]);
    } finally {
      setBranchLoading(false);
    }
  }, []);

  const loadReport = useCallback(async (filters = {}) => {
    const selectedBranch =
      filters.branchId !== undefined ? filters.branchId : branchId;
    const selectedFrom =
      filters.from !== undefined ? filters.from : from;
    const selectedTo =
      filters.to !== undefined ? filters.to : to;

    if (selectedFrom && selectedTo && selectedFrom > selectedTo) {
      setError("From date cannot be after To date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {};

      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedFrom) params.from = selectedFrom;
      if (selectedTo) params.to = selectedTo;

      const response = await getBranchWiseReport(params);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load branch-wise report."
        );
      }

      setData(Array.isArray(response.data) ? response.data : []);
      setSummary({
        ...initialSummary,
        ...(response.summary || {}),
      });

      setAppliedFilters({
        branchId: selectedBranch || "",
        from: selectedFrom || "",
        to: selectedTo || "",
      });
    } catch (err) {
      console.error("BRANCH-WISE REPORT ERROR:", err);
      setData([]);
      setSummary(initialSummary);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load branch-wise report."
      );
    } finally {
      setLoading(false);
    }
  }, [branchId, from, to]);

  // Initial load only (runs once on mount).
  // Previously this depended on `loadReport`, which changes whenever a filter
  // input changes, so every filter change re-fetched the unfiltered report.
  useEffect(() => {
    loadBranches();
    loadReport({ branchId: "", from: "", to: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setBranchId("");
    setFrom("");
    setTo("");
    setSearch("");
    loadReport({ branchId: "", from: "", to: "" });
  };

  const filteredData = data.filter((item) =>
    String(item.branchName || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  // =====================================================
  // EXCEL DOWNLOAD
  // =====================================================

  const getBranchName = (id) => {
    if (!id) return "All Branches";

    const found = branches.find((b) => String(b.id) === String(id));

    return found?.name || "Selected Branch";
  };

  const handleDownloadExcel = () => {
    try {
      const MONEY_FORMAT = "#,##0.00";
      const COUNT_FORMAT = "#,##0";

      const branchName = getBranchName(appliedFilters.branchId);
      const fromLabel = appliedFilters.from || "Beginning";
      const toLabel = appliedFilters.to || "Today";
      const hasDates = appliedFilters.from || appliedFilters.to;

      const num = (value) => Number(value || 0);

      const rows = [];

      // ---- Report details ----
      rows.push(["Branch-wise Report"]);
      rows.push([]);
      rows.push(["Branch", branchName]);
      rows.push([
        "Date Range",
        hasDates ? `${fromLabel} to ${toLabel}` : "All available dates",
      ]);
      if (search.trim()) {
        rows.push(["Search", search.trim()]);
      }
      rows.push(["Generated On", new Date().toLocaleString("en-IN")]);
      rows.push([]);

      // ---- Summary ----
      rows.push(["Summary"]);
      rows.push(["Particulars", "Value"]);

      const summaryStart = rows.length;

      const summaryRows = [
        ["Total Branches", num(summary.totalBranches), COUNT_FORMAT],
        ["Total Bills", num(summary.totalBills), COUNT_FORMAT],
        ["Total Sales (₹)", num(summary.totalSales), MONEY_FORMAT],
        ["Total GST (₹)", num(summary.totalGst), MONEY_FORMAT],
        ["Cash Collection (₹)", num(summary.cashAmount), MONEY_FORMAT],
        ["UPI Collection (₹)", num(summary.upiAmount), MONEY_FORMAT],
        ["Total Expenses (₹)", num(summary.totalExpenses), MONEY_FORMAT],
        ["Sales − Expenses (₹)", num(summary.outstanding), MONEY_FORMAT],
      ];

      summaryRows.forEach(([label, value]) => rows.push([label, value]));
      rows.push([]);

      // ---- Branch performance table ----
      rows.push(["Branch Performance"]);
      rows.push([
        "Branch",
        "Status",
        "Bills",
        "Subtotal (₹)",
        "GST (₹)",
        "Total Sales (₹)",
        "Cash (₹)",
        "UPI (₹)",
        "Expenses (₹)",
        "Sales − Expenses (₹)",
      ]);

      const tableStart = rows.length;

      filteredData.forEach((item) => {
        rows.push([
          item.branchName || "",
          item.active === false ? "Inactive" : "Active",
          num(item.totalBills),
          num(item.subtotal),
          num(item.totalGst),
          num(item.totalSales),
          num(item.cashAmount),
          num(item.upiAmount),
          num(item.totalExpenses),
          num(item.outstanding),
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Number formats — summary block
      summaryRows.forEach(([, , format], index) => {
        const ref = XLSX.utils.encode_cell({
          r: summaryStart + index,
          c: 1,
        });
        if (worksheet[ref]) worksheet[ref].z = format;
      });

      // Number formats — table block (col 2 = Bills, cols 3-9 = money)
      filteredData.forEach((_, index) => {
        for (let c = 2; c <= 9; c += 1) {
          const ref = XLSX.utils.encode_cell({
            r: tableStart + index,
            c,
          });
          if (worksheet[ref]) {
            worksheet[ref].z = c === 2 ? COUNT_FORMAT : MONEY_FORMAT;
          }
        }
      });

      worksheet["!cols"] = [
        { wch: 28 },
        { wch: 12 },
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
      ];

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Branch Report");

      // e.g. Branch_Report_All_Branches_2026-10-01_to_2026-10-13.xlsx
      const safeBranch = branchName
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");

      const datePart = hasDates
        ? `${fromLabel}_to_${toLabel}`
        : "All_Dates";

      XLSX.writeFile(
        workbook,
        `Branch_Report_${safeBranch}_${datePart}.xlsx`
      );
    } catch (err) {
      console.error("BRANCH REPORT EXCEL ERROR:", err);
      setError("Failed to download Excel file. Please try again.");
    }
  };

  const summaryCards = [
    { label: "Total Branches", value: formatNumber(summary.totalBranches) },
    { label: "Total Bills", value: formatNumber(summary.totalBills) },
    { label: "Total Sales", value: formatCurrency(summary.totalSales) },
    { label: "Total GST", value: formatCurrency(summary.totalGst) },
    { label: "Cash Collection", value: formatCurrency(summary.cashAmount) },
    { label: "UPI Collection", value: formatCurrency(summary.upiAmount) },
    { label: "Total Expenses", value: formatCurrency(summary.totalExpenses) },
    { label: "Sales − Expenses", value: formatCurrency(summary.outstanding) },
  ];

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <div>
          <h1>Branch-wise Report</h1>
          <p>Review sales, collections, GST and expenses by branch.</p>
        </div>

        <button
          type="button"
          className="report-secondary-btn"
          onClick={() => loadReport()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="reports-filter-card">
        <div className="filter-group">
          <label htmlFor="branch-filter">Branch</label>
          <select
            id="branch-filter"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={branchLoading}
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="branch-from">From Date</label>
          <input
            id="branch-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="branch-to">To Date</label>
          <input
            id="branch-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="report-primary-btn"
            onClick={() => loadReport()}
            disabled={loading}
          >
            Apply Filters
          </button>

          <button
            type="button"
            className="report-secondary-btn"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear
          </button>

          <button
            type="button"
            className="report-excel-btn"
            onClick={handleDownloadExcel}
            disabled={loading || filteredData.length === 0}
            title={
              filteredData.length === 0
                ? "No data available to download"
                : "Download this report as an Excel file"
            }
          >
            Download Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="report-error">
          <span>{error}</span>
          <button type="button" onClick={() => loadReport()}>
            Retry
          </button>
        </div>
      )}

      <div className="report-summary-grid">
        {summaryCards.map((card) => (
          <div className="report-summary-card" key={card.label}>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="report-table-card">
        <div className="report-table-header">
          <div>
            <h2>Branch Performance</h2>
            <p>{filteredData.length} branch(es)</p>
          </div>

          <input
            type="search"
            placeholder="Search branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Bills</th>
                <th>Subtotal</th>
                <th>GST</th>
                <th>Total Sales</th>
                <th>Cash</th>
                <th>UPI</th>
                <th>Expenses</th>
                <th>Sales − Expenses</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="report-loading-cell">
                    Loading branch report...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="report-empty-cell">
                    No branch report data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.branchId}>
                    <td className="food-name">
                      {item.branchName}
                      {!item.active && (
                        <small> (Inactive)</small>
                      )}
                    </td>
                    <td>{formatNumber(item.totalBills)}</td>
                    <td className="amount-cell">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(item.totalGst)}
                    </td>
                    <td className="amount-cell">
                      <strong>{formatCurrency(item.totalSales)}</strong>
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(item.cashAmount)}
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(item.upiAmount)}
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(item.totalExpenses)}
                    </td>
                    <td className="amount-cell">
                      <strong>{formatCurrency(item.outstanding)}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchWiseReport;