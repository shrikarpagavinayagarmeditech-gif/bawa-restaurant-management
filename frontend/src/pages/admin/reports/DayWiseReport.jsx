import React, { useEffect, useMemo, useState } from "react";

import * as XLSX from "xlsx";

import {
  getDayWiseReport,
} from "../../../controllers/report.controller";

import {
  getBranches,
} from "../../../controllers/branch.controller";

import "./Reports.css";

const DayWiseReport = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [data, setData] = useState([]);

  const [summary, setSummary] = useState({
    totalBills: 0,
    totalSales: 0,
    totalExpenses: 0,
    outstanding: 0,
  });

  const [branches, setBranches] = useState([]);

  const [branchId, setBranchId] = useState("");

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [branchLoading, setBranchLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [validationError, setValidationError] =
    useState("");


  // =====================================================
  // LOAD BRANCHES
  // =====================================================

  const loadBranches = async () => {
    try {
      setBranchLoading(true);

      const response = await getBranches();

      console.log(
        "DAY REPORT BRANCHES:",
        response
      );

      setBranches(
        Array.isArray(response)
          ? response
          : response?.data || []
      );

    } catch (error) {
      console.error(
        "Day report branch loading error:",
        error
      );

      setBranches([]);

    } finally {
      setBranchLoading(false);
    }
  };


  // =====================================================
  // LOAD DAY-WISE REPORT
  // =====================================================

  const loadReport = async () => {
    try {
      setValidationError("");
      setError("");

      // -------------------------------------------------
      // DATE VALIDATION
      // -------------------------------------------------

      if (from && to && from > to) {
        setValidationError(
          "From Date cannot be greater than To Date."
        );

        return;
      }

      setLoading(true);

      const params = {};

      // -------------------------------------------------
      // BRANCH FILTER
      // -------------------------------------------------

      if (branchId) {
        params.branchId = branchId;
      }

      // -------------------------------------------------
      // DATE FILTER
      // -------------------------------------------------

      if (from) {
        params.from = from;
      }

      if (to) {
        params.to = to;
      }

      console.log(
        "DAY WISE REPORT PARAMS:",
        params
      );

      const response =
        await getDayWiseReport(params);

      console.log(
        "DAY WISE REPORT RESPONSE:",
        response
      );

      // -------------------------------------------------
      // DATA
      // -------------------------------------------------

      setData(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

      // -------------------------------------------------
      // SUMMARY
      // -------------------------------------------------

      setSummary(
        response?.summary || {
          totalBills: 0,
          totalSales: 0,
          totalExpenses: 0,
          outstanding: 0,
        }
      );

    } catch (error) {
      console.error(
        "Day wise report error:",
        error
      );

      setData([]);

      setSummary({
        totalBills: 0,
        totalSales: 0,
        totalExpenses: 0,
        outstanding: 0,
      });

      setError(
        error?.response?.data?.message ||
        "Failed to load day-wise report"
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
    loadReport();
  }, []);


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredData = useMemo(() => {
    if (!search.trim()) {
      return data;
    }

    const searchText =
      search.trim().toLowerCase();

    return data.filter((item) => {
      const date =
        String(
          item?.date || ""
        ).toLowerCase();

      return date.includes(searchText);
    });
  }, [data, search]);


  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = async () => {
    setBranchId("");
    setFrom("");
    setTo("");
    setSearch("");
    setValidationError("");
    setError("");

    try {
      setLoading(true);

      const response =
        await getDayWiseReport({});

      console.log(
        "DAY REPORT AFTER CLEAR:",
        response
      );

      setData(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

      setSummary(
        response?.summary || {
          totalBills: 0,
          totalSales: 0,
          totalExpenses: 0,
          outstanding: 0,
        }
      );

    } catch (error) {
      console.error(
        "Clear day report error:",
        error
      );

      setError(
        error?.response?.data?.message ||
        "Failed to reload report"
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };


  // =====================================================
  // FORMAT NUMBER
  // =====================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString(
      "en-IN"
    );
  };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };


  // =====================================================
  // DOWNLOAD EXCEL
  // =====================================================

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      setError("No data available to download.");
      return;
    }

    try {
      setError("");

      const branchName =
        branches.find(
          (b) => String(b.id) === String(branchId)
        )?.name || "All Branches";

      // -------------------------------------------------
      // BUILD SHEET ROWS (array of arrays)
      // -------------------------------------------------

      const rows = [];

      rows.push(["Day-wise Report"]);
      rows.push(["Branch", branchName]);
      rows.push(["From Date", from || "All"]);
      rows.push(["To Date", to || "All"]);

      if (search.trim()) {
        rows.push(["Search", search.trim()]);
      }

      rows.push([]);

      rows.push([
        "#",
        "Date",
        "Bills",
        "Cash (₹)",
        "UPI (₹)",
        "Total Sales (₹)",
        "Expenses (₹)",
        "Outstanding (₹)",
      ]);

      filteredData.forEach((item, index) => {
        rows.push([
          index + 1,
          formatDate(item.date),
          Number(item.bills || 0),
          Number(item.cashAmount || 0),
          Number(item.upiAmount || 0),
          Number(item.sales || 0),
          Number(item.expenses || 0),
          Number(item.outstanding || 0),
        ]);
      });

      // -------------------------------------------------
      // TOTAL ROW (based on rows currently shown)
      // -------------------------------------------------

      const sumOf = (key) =>
        filteredData.reduce(
          (sum, item) =>
            sum + Number(item[key] || 0),
          0
        );

      rows.push([]);

      rows.push([
        "",
        "TOTAL",
        sumOf("bills"),
        sumOf("cashAmount"),
        sumOf("upiAmount"),
        sumOf("sales"),
        sumOf("expenses"),
        sumOf("outstanding"),
      ]);

      // -------------------------------------------------
      // CREATE WORKBOOK
      // -------------------------------------------------

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 10 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Day Report"
      );

      // -------------------------------------------------
      // FILE NAME
      // -------------------------------------------------

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const datePart =
        from || to
          ? `${from || "start"}_to_${to || "today"}`
          : today;

      XLSX.writeFile(
        workbook,
        `Day_Wise_Report_${datePart}.xlsx`
      );

    } catch (err) {
      console.error("Excel download error:", err);

      setError("Failed to download Excel file.");
    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="reports-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="reports-page-header">

        <div>

          <h1>
            Day-wise Report
          </h1>

          <p>
            View daily sales, expenses and
            outstanding
          </p>

        </div>

      </div>


      {/* =================================================
          FILTER CARD
      ================================================= */}

      <div className="reports-filter-card">

        {/* -------------------------------------------------
            BRANCH
        ------------------------------------------------- */}

        <div className="filter-group">

          <label>
            Branch
          </label>

          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setValidationError("");
            }}
            disabled={branchLoading}
          >

            <option value="">
              All Branches
            </option>

            {branches.map((branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name}
              </option>
            ))}

          </select>

        </div>


        {/* -------------------------------------------------
            FROM DATE
        ------------------------------------------------- */}

        <div className="filter-group">

          <label>
            From Date
          </label>

          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setValidationError("");
            }}
          />

        </div>


        {/* -------------------------------------------------
            TO DATE
        ------------------------------------------------- */}

        <div className="filter-group">

          <label>
            To Date
          </label>

          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setValidationError("");
            }}
          />

        </div>


        {/* -------------------------------------------------
            ACTIONS
        ------------------------------------------------- */}

        <div className="filter-actions">

          <button
            type="button"
            className="report-primary-btn"
            onClick={loadReport}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Apply Filter"}
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
            className="report-secondary-btn"
            onClick={handleDownloadExcel}
            disabled={
              loading || filteredData.length === 0
            }
          >
            Download Excel
          </button>

        </div>

      </div>


      {/* =================================================
          VALIDATION ERROR
      ================================================= */}

      {validationError && (
        <div className="report-error">
          {validationError}
        </div>
      )}


      {/* =================================================
          API ERROR
      ================================================= */}

      {error && (
        <div className="report-error">
          {error}
        </div>
      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="report-summary-grid">

        {/* -------------------------------------------------
            TOTAL BILLS
        ------------------------------------------------- */}

        <div className="report-summary-card">

          <span>
            Total Bills
          </span>

          <strong>
            {formatNumber(
              summary.totalBills
            )}
          </strong>

        </div>


        {/* -------------------------------------------------
            TOTAL SALES
        ------------------------------------------------- */}

        <div className="report-summary-card">

          <span>
            Total Sales
          </span>

          <strong>
            {formatCurrency(
              summary.totalSales
            )}
          </strong>

        </div>


        {/* -------------------------------------------------
            TOTAL EXPENSES
        ------------------------------------------------- */}

        <div className="report-summary-card">

          <span>
            Total Expenses
          </span>

          <strong>
            {formatCurrency(
              summary.totalExpenses
            )}
          </strong>

        </div>


        {/* -------------------------------------------------
            OUTSTANDING
        ------------------------------------------------- */}

        <div className="report-summary-card">

          <span>
            Outstanding
          </span>

          <strong>
            {formatCurrency(
              summary.outstanding
            )}
          </strong>

        </div>

      </div>


      {/* =================================================
          TABLE CARD
      ================================================= */}

      <div className="report-table-card">

        {/* -------------------------------------------------
            TABLE HEADER
        ------------------------------------------------- */}

        <div className="report-table-header">

          <div>

            <h2>
              Daily Sales
            </h2>

            <p>
              Sales and expenses grouped by date
            </p>

          </div>


          {/* -------------------------------------------------
              SEARCH
          ------------------------------------------------- */}

          <div
            style={{
              minWidth: "220px",
            }}
          >

            <input
              type="text"
              placeholder="Search date..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border:
                  "1px solid #d9dee7",
                borderRadius: "8px",
                outline: "none",
                fontSize: "14px",
              }}
            />

          </div>

        </div>


        {/* -------------------------------------------------
            TABLE
        ------------------------------------------------- */}

        <div className="report-table-wrapper">

          <table className="report-table">

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  Date
                </th>

                <th>
                  Bills
                </th>

                <th>
                  Cash
                </th>

                <th>
                  UPI
                </th>

                <th>
                  Total Sales
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

              {/* -------------------------------------------------
                  LOADING
              ------------------------------------------------- */}

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="report-loading-cell"
                  >
                    Loading report...
                  </td>

                </tr>

              ) : filteredData.length === 0 ? (

                /* -------------------------------------------------
                    EMPTY
                ------------------------------------------------- */

                <tr>

                  <td
                    colSpan="8"
                    className="report-empty-cell"
                  >

                    {search
                      ? "No matching dates found"
                      : "No daily sales found"}

                  </td>

                </tr>

              ) : (

                /* -------------------------------------------------
                    DATA
                ------------------------------------------------- */

                filteredData.map(
                  (item, index) => (

                    <tr
                      key={
                        item.date ||
                        index
                      }
                    >

                      <td>
                        {index + 1}
                      </td>


                      <td className="food-name">

                        {formatDate(
                          item.date
                        )}

                      </td>


                      <td className="quantity-cell">

                        {formatNumber(
                          item.bills
                        )}

                      </td>


                      <td className="amount-cell">

                        {formatCurrency(
                          item.cashAmount
                        )}

                      </td>


                      <td className="amount-cell">

                        {formatCurrency(
                          item.upiAmount
                        )}

                      </td>


                      <td className="amount-cell">

                        <strong>
                          {formatCurrency(
                            item.sales
                          )}
                        </strong>

                      </td>


                      <td className="amount-cell">

                        {formatCurrency(
                          item.expenses
                        )}

                      </td>


                      <td className="amount-cell">

                        <strong>
                          {formatCurrency(
                            item.outstanding
                          )}
                        </strong>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading &&
          filteredData.length > 0 && (

            <div
              style={{
                padding: "14px 18px",
                borderTop:
                  "1px solid #e5e7eb",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                fontSize: "13px",
                color: "#667085",
              }}
            >

              <span>
                Showing{" "}
                <strong>
                  {filteredData.length}
                </strong>{" "}
                days
              </span>

              {search && (
                <span>
                  Search:{" "}
                  <strong>
                    {search}
                  </strong>
                </span>
              )}

            </div>

          )}

      </div>

    </div>
  );
};

export default DayWiseReport;