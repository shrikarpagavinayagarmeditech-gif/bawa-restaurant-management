import React, { useEffect, useMemo, useState } from "react";

import * as XLSX from "xlsx";

import {
  getFoodWiseReport,
} from "../../../controllers/report.controller";

import {
  getBranches,
} from "../../../controllers/branch.controller";

import "./Reports.css";

const FoodWiseReport = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [data, setData] = useState([]);

  const [summary, setSummary] = useState({
    totalFoodItems: 0,
    totalQuantity: 0,
    totalSales: 0,
  });

  const [branches, setBranches] = useState([]);

  const [branchId, setBranchId] = useState("");

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [search, setSearch] = useState("");

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

      console.log("FOOD REPORT BRANCHES:", response);

      /*
       * getBranches() already returns response.data
       *
       * Expected:
       * [
       *   {
       *     id: "...",
       *     name: "Branch 1"
       *   }
       * ]
       */

      setBranches(
        Array.isArray(response)
          ? response
          : response?.data || []
      );

    } catch (error) {
      console.error(
        "Food report branch loading error:",
        error
      );

      setBranches([]);

    } finally {
      setBranchLoading(false);
    }
  };


  // =====================================================
  // LOAD FOOD-WISE REPORT
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
        "FOOD WISE REPORT PARAMS:",
        params
      );

      const response = await getFoodWiseReport(params);

      console.log(
        "FOOD WISE REPORT RESPONSE:",
        response
      );

      // -------------------------------------------------
      // SET DATA
      // -------------------------------------------------

      setData(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

      // -------------------------------------------------
      // SET SUMMARY
      // -------------------------------------------------

      setSummary(
        response?.summary || {
          totalFoodItems: 0,
          totalQuantity: 0,
          totalSales: 0,
        }
      );

    } catch (error) {
      console.error(
        "Food wise report error:",
        error
      );

      setData([]);

      setSummary({
        totalFoodItems: 0,
        totalQuantity: 0,
        totalSales: 0,
      });

      setError(
        error?.response?.data?.message ||
        "Failed to load food-wise report"
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
  // SEARCH FILTER
  // =====================================================

  const filteredData = useMemo(() => {
    if (!search.trim()) {
      return data;
    }

    const searchText =
      search.trim().toLowerCase();

    return data.filter((item) => {
      const foodName =
        String(
          item?.foodName || ""
        ).toLowerCase();

      const categoryName =
        String(
          item?.categoryName || ""
        ).toLowerCase();

      return (
        foodName.includes(searchText) ||
        categoryName.includes(searchText)
      );
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

    /*
     * Directly load without filters.
     * Avoid setTimeout dependency.
     */

    try {
      setLoading(true);

      const response =
        await getFoodWiseReport({});

      console.log(
        "FOOD REPORT AFTER CLEAR:",
        response
      );

      setData(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

      setSummary(
        response?.summary || {
          totalFoodItems: 0,
          totalQuantity: 0,
          totalSales: 0,
        }
      );

    } catch (error) {
      console.error(
        "Clear food report error:",
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
  // APPLY FILTER
  // =====================================================

  const handleApplyFilter = () => {
    loadReport();
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

      rows.push(["Food-wise Report"]);
      rows.push(["Branch", branchName]);
      rows.push(["From Date", from || "All"]);
      rows.push(["To Date", to || "All"]);

      if (search.trim()) {
        rows.push(["Search", search.trim()]);
      }

      rows.push([]);

      rows.push([
        "#",
        "Food Name",
        "Category",
        "Quantity",
        "Sales Amount (₹)",
      ]);

      filteredData.forEach((item, index) => {
        rows.push([
          index + 1,
          item.foodName || "-",
          item.categoryName || "-",
          Number(item.quantity || 0),
          Number(item.salesAmount || 0),
        ]);
      });

      // -------------------------------------------------
      // TOTAL ROW (based on rows currently shown)
      // -------------------------------------------------

      const totalQuantity = filteredData.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

      const totalSales = filteredData.reduce(
        (sum, item) =>
          sum + Number(item.salesAmount || 0),
        0
      );

      rows.push([]);

      rows.push([
        "",
        "TOTAL",
        "",
        totalQuantity,
        totalSales,
      ]);

      // -------------------------------------------------
      // CREATE WORKBOOK
      // -------------------------------------------------

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 32 },
        { wch: 24 },
        { wch: 14 },
        { wch: 20 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Food Report"
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
        `Food_Wise_Report_${datePart}.xlsx`
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
            Food-wise Report
          </h1>

          <p>
            View food sales, quantity and revenue
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
            onClick={handleApplyFilter}
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
          SUMMARY CARDS
      ================================================= */}

      <div className="report-summary-grid">

        {/* -------------------------------------------------
            FOOD ITEMS
        ------------------------------------------------- */}

        <div className="report-summary-card">

          <span>
            Food Items
          </span>

          <strong>
            {formatNumber(
              summary.totalFoodItems
            )}
          </strong>

        </div>


        {/* -------------------------------------------------
            TOTAL QUANTITY
        ------------------------------------------------- */}

        <div className="report-summary-card">

          <span>
            Total Quantity
          </span>

          <strong>
            {formatNumber(
              summary.totalQuantity
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

      </div>


      {/* =================================================
          FOOD SALES TABLE
      ================================================= */}

      <div className="report-table-card">

        {/* -------------------------------------------------
            TABLE HEADER
        ------------------------------------------------- */}

        <div className="report-table-header">

          <div>

            <h2>
              Food Sales
            </h2>

            <p>
              Completed bill items
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
              placeholder="Search food or category..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d9dee7",
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
                  Food Name
                </th>

                <th>
                  Category
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Sales Amount
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
                    colSpan="5"
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
                    colSpan="5"
                    className="report-empty-cell"
                  >

                    {search
                      ? "No matching food items found"
                      : "No food sales found"}

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
                        item.foodItemId ||
                        index
                      }
                    >

                      <td>
                        {index + 1}
                      </td>


                      <td className="food-name">

                        {item.foodName || "-"}

                      </td>


                      <td>

                        {item.categoryName || "-"}

                      </td>


                      <td className="quantity-cell">

                        {formatNumber(
                          item.quantity
                        )}

                      </td>


                      <td className="amount-cell">

                        {formatCurrency(
                          item.salesAmount
                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            TABLE FOOTER
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
                food items
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

export default FoodWiseReport;