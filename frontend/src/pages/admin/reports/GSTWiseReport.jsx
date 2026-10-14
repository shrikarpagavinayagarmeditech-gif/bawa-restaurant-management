import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { getGstWiseReport } from "../../../controllers/report.controller";
import { getBranches } from "../../../controllers/branch.controller";

import "./Reports.css";

const INITIAL_SUMMARY = {
  totalBills: 0,
  subtotal: 0,
  taxableAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  totalGst: 0,
  totalSales: 0,
  cashAmount: 0,
  upiAmount: 0,
};

const INITIAL_APPLIED_FILTERS = {
  branchId: "",
  from: "",
  to: "",
};

const GSTWiseReport = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [summary, setSummary] = useState(INITIAL_SUMMARY);

  // Filters that were actually used to load the data currently on screen.
  // The Excel file uses these, so it always matches what the user sees,
  // even if they changed the inputs but haven't clicked "Apply Filter".
  const [appliedFilters, setAppliedFilters] = useState(
    INITIAL_APPLIED_FILTERS
  );

  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);

  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  // =====================================================
  // LOAD BRANCHES
  // =====================================================

  const loadBranches = async () => {
    try {
      setBranchLoading(true);

      const response = await getBranches();

      const branchList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setBranches(branchList);
    } catch (err) {
      console.error("GST branch loading error:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load branches."
      );
    } finally {
      setBranchLoading(false);
    }
  };

  // =====================================================
  // LOAD GST REPORT
  // =====================================================

  const loadReport = async (filters = {}) => {
    try {
      setError("");
      setValidationError("");

      const selectedFrom = filters.from ?? from;
      const selectedTo = filters.to ?? to;
      const selectedBranch = filters.branchId ?? branchId;

      if (
        selectedFrom &&
        selectedTo &&
        selectedFrom > selectedTo
      ) {
        setValidationError(
          "From Date cannot be greater than To Date."
        );
        return;
      }

      setLoading(true);

      const params = {};

      if (selectedBranch) {
        params.branchId = selectedBranch;
      }

      if (selectedFrom) {
        params.from = selectedFrom;
      }

      if (selectedTo) {
        params.to = selectedTo;
      }

      console.log("GST REPORT FILTERS:", params);

      const response = await getGstWiseReport(params);

      console.log("GST REPORT RESPONSE:", response);

      if (response?.success === false) {
        throw new Error(
          response?.message || "Failed to load GST report."
        );
      }

      setSummary({
        ...INITIAL_SUMMARY,
        ...(response?.summary || {}),
      });

      setAppliedFilters({
        branchId: selectedBranch || "",
        from: selectedFrom || "",
        to: selectedTo || "",
      });
    } catch (err) {
      console.error("GST report error:", err);

      setSummary(INITIAL_SUMMARY);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load GST-wise report."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadBranches();
    loadReport({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setBranchId("");
    setFrom("");
    setTo("");
    setValidationError("");
    setError("");

    loadReport({
      branchId: "",
      from: "",
      to: "",
    });
  };

  // =====================================================
  // FORMAT HELPERS
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  // Branch name for a given branch id (handles number vs string ids)
  const getBranchName = (id) => {
    if (!id) return "All Branches";

    const found = branches.find((b) => String(b.id) === String(id));

    return found?.name || "Selected Branch";
  };

  // =====================================================
  // EXCEL DOWNLOAD
  // =====================================================

  const handleDownloadExcel = () => {
    try {
      const branchName = getBranchName(appliedFilters.branchId);
      const fromLabel = appliedFilters.from || "Beginning";
      const toLabel = appliedFilters.to || "Today";

      const MONEY_FORMAT = "#,##0.00";
      const NUMBER_FORMAT = "#,##0";

      // Each row: [label/col1, col2, col3, col4]
      const rows = [
        ["GST-wise Report"],
        [],
        ["Branch", branchName],
        [
          "Date Range",
          appliedFilters.from || appliedFilters.to
            ? `${fromLabel} to ${toLabel}`
            : "All available dates",
        ],
        ["Generated On", new Date().toLocaleString("en-IN")],
        [],

        // GST SUMMARY
        ["GST Summary"],
        ["Particulars", "Amount (₹)"],
        ["Total Bills", Number(summary.totalBills || 0)],
        ["Subtotal (Before Tax)", Number(summary.subtotal || 0)],
        ["Taxable Amount", Number(summary.taxableAmount || 0)],
        ["Total Sales (Including Tax)", Number(summary.totalSales || 0)],
        [],

        // TAX BREAKDOWN
        ["Tax Breakdown"],
        ["#", "Tax Type", "Description", "Amount (₹)"],
        [1, "CGST", "Central GST", Number(summary.cgstAmount || 0)],
        [2, "SGST", "State GST", Number(summary.sgstAmount || 0)],
        [
          3,
          "Total GST",
          "Recorded total tax amount",
          Number(summary.totalGst || 0),
        ],
        [],

        // PAYMENT BREAKDOWN
        ["Payment Breakdown"],
        ["Payment Mode", "Amount (₹)"],
        ["Cash Collection", Number(summary.cashAmount || 0)],
        ["UPI Collection", Number(summary.upiAmount || 0)],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Number formats: "Total Bills" row is a count, everything else numeric is money
      rows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          if (typeof value !== "number") return;

          // Skip the "#" serial number column in the Tax Breakdown table
          if (colIndex === 0) return;

          const cellRef = XLSX.utils.encode_cell({
            r: rowIndex,
            c: colIndex,
          });

          if (!worksheet[cellRef]) return;

          worksheet[cellRef].z =
            row[0] === "Total Bills" ? NUMBER_FORMAT : MONEY_FORMAT;
        });
      });

      // Column widths
      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 24 },
        { wch: 28 },
        { wch: 18 },
      ];

      // Merge the title across the table width
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "GST Report");

      // File name, e.g. GST_Report_Main_Branch_2026-10-01_to_2026-10-13.xlsx
      const safeBranch = branchName
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");

      const datePart =
        appliedFilters.from || appliedFilters.to
          ? `${appliedFilters.from || "Beginning"}_to_${
              appliedFilters.to || "Today"
            }`
          : "All_Dates";

      XLSX.writeFile(
        workbook,
        `GST_Report_${safeBranch}_${datePart}.xlsx`
      );
    } catch (err) {
      console.error("GST Excel export error:", err);
      setError("Failed to download Excel file. Please try again.");
    }
  };

  // =====================================================
  // SUMMARY CARD
  // =====================================================

  const renderSummaryCard = (title, value, icon, type = "money") => (
    <div className="report-summary-card" key={title}>
      <span>{title}</span>

      <strong>
        {type === "number"
          ? formatNumber(value)
          : formatCurrency(value)}
      </strong>

      <small>{icon}</small>
    </div>
  );

  // =====================================================
  // UI
  // =====================================================

  const hasData = Number(summary.totalBills) > 0;

  return (
    <div className="reports-page">
      {/* HEADER */}

      <div className="reports-page-header">
        <div>
          <h1>GST-wise Report</h1>
          <p>
            View taxable sales, CGST, SGST and total GST
          </p>
        </div>
      </div>

      {/* FILTERS */}

      <div className="reports-filter-card">
        <div className="filter-group">
          <label htmlFor="gstBranch">Branch</label>

          <select
            id="gstBranch"
            value={branchId}
            disabled={branchLoading || loading}
            onChange={(e) => setBranchId(e.target.value)}
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
          <label htmlFor="gstFrom">From Date</label>

          <input
            id="gstFrom"
            type="date"
            value={from}
            max={to || undefined}
            disabled={loading}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="gstTo">To Date</label>

          <input
            id="gstTo"
            type="date"
            value={to}
            min={from || undefined}
            disabled={loading}
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
            {loading ? "Loading..." : "Apply Filter"}
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
            disabled={loading || !hasData}
            title={
              hasData
                ? "Download this report as an Excel file"
                : "No data available to download"
            }
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* ERRORS */}

      {validationError && (
        <div className="report-error">
          {validationError}
        </div>
      )}

      {error && (
        <div className="report-error">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <p style={{ padding: "8px 0" }}>
          Loading GST report...
        </p>
      )}

      {/* GST SUMMARY */}

      <div className="report-table-card">
        <div className="report-table-header">
          <div>
            <h2>GST Summary</h2>
            <p>
              {getBranchName(branchId)}
              {" · "}
              {from || to
                ? `${from || "Beginning"} to ${to || "Today"}`
                : "All available dates"}
            </p>
          </div>
        </div>

        <div className="report-summary-grid">
          {renderSummaryCard(
            "Total Bills",
            summary.totalBills,
            "Completed bills",
            "number"
          )}

          {renderSummaryCard(
            "Subtotal",
            summary.subtotal,
            "Before tax"
          )}

          {renderSummaryCard(
            "Taxable Amount",
            summary.taxableAmount,
            "Amount subject to tax"
          )}

          {renderSummaryCard(
            "Total Sales",
            summary.totalSales,
            "Including tax"
          )}
        </div>
      </div>

      {/* TAX BREAKDOWN */}

      <div className="report-table-card" style={{ marginTop: 20 }}>
        <div className="report-table-header">
          <div>
            <h2>Tax Breakdown</h2>
            <p>GST amounts from completed bills</p>
          </div>
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tax Type</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>1</td>
                <td className="food-name">CGST</td>
                <td>Central GST</td>
                <td className="amount-cell">
                  {formatCurrency(summary.cgstAmount)}
                </td>
              </tr>

              <tr>
                <td>2</td>
                <td className="food-name">SGST</td>
                <td>State GST</td>
                <td className="amount-cell">
                  {formatCurrency(summary.sgstAmount)}
                </td>
              </tr>

              <tr>
                <td>3</td>
                <td className="food-name">Total GST</td>
                <td>Recorded total tax amount</td>
                <td className="amount-cell">
                  <strong>
                    {formatCurrency(summary.totalGst)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT BREAKDOWN */}

      <div className="report-table-card" style={{ marginTop: 20 }}>
        <div className="report-table-header">
          <div>
            <h2>Payment Breakdown</h2>
            <p>Payment amounts for the selected report</p>
          </div>
        </div>

        <div className="report-summary-grid">
          {renderSummaryCard(
            "Cash Collection",
            summary.cashAmount,
            "Cash payments"
          )}

          {renderSummaryCard(
            "UPI Collection",
            summary.upiAmount,
            "UPI payments"
          )}
        </div>
      </div>
    </div>
  );
};

export default GSTWiseReport;