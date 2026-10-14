import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getBranchComparisonReport } from "../../../controllers/report.controller";
import "./Reports.css";

const emptySummary = {
  totalBranches: 0,
  totalBills: 0,
  totalSales: 0,
  totalGst: 0,
  cashAmount: 0,
  upiAmount: 0,
  totalExpenses: 0,
  outstanding: 0,
};

const BranchComparisonReport = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(emptySummary);

  // Date range used to load the data currently on screen. The Excel file
  // uses this so it always matches the table, even if the date inputs were
  // changed but "Apply Filters" hasn't been clicked yet.
  const [appliedFilters, setAppliedFilters] = useState({
    from: "",
    to: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("totalSales");
  const [sortDirection, setSortDirection] = useState("desc");

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const loadReport = async (filters = {}) => {
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
      if (selectedFrom) params.from = selectedFrom;
      if (selectedTo) params.to = selectedTo;

      const response = await getBranchComparisonReport(params);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load branch comparison."
        );
      }

      setData(Array.isArray(response.data) ? response.data : []);
      setSummary({
        ...emptySummary,
        ...(response.summary || {}),
      });

      setAppliedFilters({
        from: selectedFrom || "",
        to: selectedTo || "",
      });
    } catch (err) {
      console.error("BRANCH COMPARISON ERROR:", err);
      setData([]);
      setSummary(emptySummary);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load branch comparison report."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport({ from: "", to: "" });
    // Load the report on initial screen mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setSearch("");
    loadReport({ from: "", to: "" });
  };

  const filteredData = data
    .filter((item) =>
      String(item.branchName || "")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
    .sort((a, b) => {
      const first = a[sortBy] ?? 0;
      const second = b[sortBy] ?? 0;

      if (typeof first === "string") {
        return sortDirection === "asc"
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }

      return sortDirection === "asc"
        ? Number(first) - Number(second)
        : Number(second) - Number(first);
    });

  // Totals of the rows currently shown (used by the table footer and Excel)
  const sumOf = (field) =>
    filteredData.reduce((sum, item) => sum + Number(item[field] || 0), 0);

  const filteredTotals = {
    totalBills: sumOf("totalBills"),
    totalSales: sumOf("totalSales"),
    totalGst: sumOf("totalGst"),
    cashAmount: sumOf("cashAmount"),
    upiAmount: sumOf("upiAmount"),
    totalExpenses: sumOf("totalExpenses"),
    outstanding: sumOf("outstanding"),
  };

  const changeSort = (field) => {
    if (sortBy === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortDirection(
        field === "branchName" ? "asc" : "desc"
      );
    }
  };

  const sortLabel = (field, label) =>
    `${label}${sortBy === field
      ? sortDirection === "asc"
        ? " ↑"
        : " ↓"
      : ""}`;

  // =====================================================
  // EXCEL DOWNLOAD
  // =====================================================

  const handleDownloadExcel = () => {
    try {
      const MONEY_FORMAT = "#,##0.00";
      const COUNT_FORMAT = "#,##0";

      const fromLabel = appliedFilters.from || "Beginning";
      const toLabel = appliedFilters.to || "Today";
      const hasDates = appliedFilters.from || appliedFilters.to;

      const num = (value) => Number(value || 0);

      const rows = [];

      // ---- Report details ----
      rows.push(["Branch Comparison Report"]);
      rows.push([]);
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
        ["Branches", num(summary.totalBranches), COUNT_FORMAT],
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

      // ---- Branch comparison table (same order as on screen) ----
      rows.push(["Branch Performance Comparison"]);
      rows.push([
        "Branch",
        "Status",
        "Bills",
        "Total Sales (₹)",
        "GST (₹)",
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
          num(item.totalSales),
          num(item.totalGst),
          num(item.cashAmount),
          num(item.upiAmount),
          num(item.totalExpenses),
          num(item.outstanding),
        ]);
      });

      // Filtered total row
      rows.push([
        "Filtered Total",
        "",
        filteredTotals.totalBills,
        filteredTotals.totalSales,
        filteredTotals.totalGst,
        filteredTotals.cashAmount,
        filteredTotals.upiAmount,
        filteredTotals.totalExpenses,
        filteredTotals.outstanding,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Number formats — summary block
      summaryRows.forEach(([, , format], index) => {
        const ref = XLSX.utils.encode_cell({
          r: summaryStart + index,
          c: 1,
        });
        if (worksheet[ref]) worksheet[ref].z = format;
      });

      // Number formats — table rows + total row (col 2 = Bills, 3-8 = money)
      for (let r = tableStart; r <= tableStart + filteredData.length; r += 1) {
        for (let c = 2; c <= 8; c += 1) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (worksheet[ref]) {
            worksheet[ref].z = c === 2 ? COUNT_FORMAT : MONEY_FORMAT;
          }
        }
      }

      worksheet["!cols"] = [
        { wch: 28 },
        { wch: 12 },
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
      ];

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Branch Comparison");

      // e.g. Branch_Comparison_2026-10-01_to_2026-10-13.xlsx
      const datePart = hasDates
        ? `${fromLabel}_to_${toLabel}`
        : "All_Dates";

      XLSX.writeFile(workbook, `Branch_Comparison_${datePart}.xlsx`);
    } catch (err) {
      console.error("BRANCH COMPARISON EXCEL ERROR:", err);
      setError("Failed to download Excel file. Please try again.");
    }
  };

  const cards = [
    { label: "Branches", value: formatNumber(summary.totalBranches) },
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
          <h1>Branch Comparison Report</h1>
          <p>Compare sales and collections across all branches.</p>
        </div>

        <button
          type="button"
          className="report-secondary-btn"
          onClick={() => loadReport()}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="reports-filter-card">
        <div className="filter-group">
          <label htmlFor="comparison-from">From Date</label>
          <input
            id="comparison-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="comparison-to">To Date</label>
          <input
            id="comparison-to"
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
        {cards.map((card) => (
          <div className="report-summary-card" key={card.label}>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="report-table-card">
        <div className="report-table-header">
          <div>
            <h2>Branch Performance Comparison</h2>
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
                <th>
                  <button
                    type="button"
                    onClick={() => changeSort("branchName")}
                  >
                    {sortLabel("branchName", "Branch")}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => changeSort("totalBills")}
                  >
                    {sortLabel("totalBills", "Bills")}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => changeSort("totalSales")}
                  >
                    {sortLabel("totalSales", "Total Sales")}
                  </button>
                </th>
                <th>GST</th>
                <th>Cash</th>
                <th>UPI</th>
                <th>
                  <button
                    type="button"
                    onClick={() => changeSort("totalExpenses")}
                  >
                    {sortLabel("totalExpenses", "Expenses")}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => changeSort("outstanding")}
                  >
                    {sortLabel("outstanding", "Sales − Expenses")}
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="report-loading-cell">
                    Loading comparison...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="report-empty-cell">
                    No branch data found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.branchId}>
                    <td className="food-name">
                      {item.branchName}
                      {!item.active && <small> (Inactive)</small>}
                    </td>
                    <td>{formatNumber(item.totalBills)}</td>
                    <td className="amount-cell">
                      <strong>{formatCurrency(item.totalSales)}</strong>
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(item.totalGst)}
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

            {!loading && filteredData.length > 0 && (
              <tfoot>
                <tr>
                  <th>Filtered Total</th>
                  <th>{formatNumber(filteredTotals.totalBills)}</th>
                  <th>{formatCurrency(filteredTotals.totalSales)}</th>
                  <th>{formatCurrency(filteredTotals.totalGst)}</th>
                  <th>{formatCurrency(filteredTotals.cashAmount)}</th>
                  <th>{formatCurrency(filteredTotals.upiAmount)}</th>
                  <th>{formatCurrency(filteredTotals.totalExpenses)}</th>
                  <th>{formatCurrency(filteredTotals.outstanding)}</th>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchComparisonReport;