
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import expenseController from "../../../controllers/expense.controller";
import { getBranches } from "../../../controllers/branch.controller";

const today = new Date().toLocaleDateString("en-CA");

const initialForm = {
  branchId: "",
  category: "",
  amount: "",
  date: today,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLocalDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [filters, setFilters] = useState({
    branchId: "",
    category: "",
    from: "",
    to: "",
  });

  // ==========================================
  // LOAD BRANCHES
  // ==========================================
  const loadBranches = async () => {
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
  };

  // ==========================================
  // FILTER PARAMETERS
  // ==========================================
  const getFilterParams = (currentFilters = filters) => {
    const params = {};

    if (currentFilters.branchId) {
      params.branchId = currentFilters.branchId;
    }

    if (currentFilters.category.trim()) {
      params.category = currentFilters.category.trim();
    }

    if (currentFilters.from) {
      params.from = currentFilters.from;
    }

    if (currentFilters.to) {
      params.to = currentFilters.to;
    }

    return params;
  };

  // ==========================================
  // LOAD EXPENSES
  // ==========================================
  const loadExpenses = async (params = getFilterParams()) => {
    setLoading(true);
    setError("");

    try {
      const response = await expenseController.getExpenses(params);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to load expenses");
      }

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setExpenses(list);
    } catch (err) {
      console.error("Expense loading error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load expenses."
      );

      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadExpenses({});
  }, []);

  // ==========================================
  // FORM HANDLING
  // ==========================================
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...initialForm,
      branchId: branches.length ? String(branches[0].id) : "",
      date: today,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (expense) => {
    setEditingId(expense.id);

    setForm({
      branchId: String(expense.branchId ?? expense.branch?.id ?? ""),
      category: expense.category || "",
      amount: String(expense.amount ?? ""),
      date: getLocalDate(expense.date),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  // ==========================================
  // SAVE / UPDATE EXPENSE
  // ==========================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.branchId) {
      setError("Please select a branch.");
      return;
    }

    if (!form.category.trim()) {
      setError("Please enter an expense category.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    const payload = {
      branchId: form.branchId,
      category: form.category.trim(),
      amount: Number(form.amount),
      date: form.date,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await expenseController.updateExpense(editingId, payload);
        setSuccess("Expense updated successfully.");
      } else {
        await expenseController.createExpense(payload);
        setSuccess("Expense added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await loadExpenses(getFilterParams());
    } catch (err) {
      console.error("Save expense error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE EXPENSE
  // ==========================================
  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `Delete expense "${expense.category}" for ${formatCurrency(
        expense.amount
      )}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await expenseController.deleteExpense(expense.id);

      setSuccess("Expense deleted successfully.");

      await loadExpenses(getFilterParams());
    } catch (err) {
      console.error("Delete expense error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete expense."
      );
    }
  };

  // ==========================================
  // FILTER HANDLING
  // ==========================================
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    if (filters.from && filters.to && filters.from > filters.to) {
      setError("From date cannot be later than To date.");
      return;
    }

    setError("");
    setSuccess("");
    loadExpenses(getFilterParams());
  };

  const handleClearFilters = () => {
    const cleared = {
      branchId: "",
      category: "",
      from: "",
      to: "",
    };

    setFilters(cleared);
    setError("");
    setSuccess("");

    loadExpenses({});
  };

  // ==========================================
  // SUMMARY
  // ==========================================
  const totalExpense = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );

  const uniqueCategories = new Set(
    expenses.map((expense) => expense.category).filter(Boolean)
  ).size;

  // ==========================================
  // EXPORT EXCEL
  // ==========================================
  const handleExportExcel = () => {
    if (!expenses.length) {
      setError("No expense records available to export.");
      return;
    }

    const details = expenses.map((expense, index) => ({
      "S.No": index + 1,
      "Branch": expense.branch?.name || "N/A",
      "Category": expense.category || "N/A",
      "Amount (INR)": Number(expense.amount) || 0,
      "Expense Date": getLocalDate(expense.date),
      "Created At": expense.createdAt
        ? formatDate(expense.createdAt)
        : "",
    }));

    const summary = [
      { Particulars: "Expense Report", Value: "" },
      { Particulars: "Generated Date", Value: today },
      {
        Particulars: "Branch Filter",
        Value:
          branches.find(
            (branch) => String(branch.id) === String(filters.branchId)
          )?.name || "All Branches",
      },
      {
        Particulars: "Category Filter",
        Value: filters.category || "All Categories",
      },
      {
        Particulars: "From Date",
        Value: filters.from || "All Dates",
      },
      {
        Particulars: "To Date",
        Value: filters.to || "All Dates",
      },
      { Particulars: "Total Expense Records", Value: expenses.length },
      { Particulars: "Total Categories", Value: uniqueCategories },
      { Particulars: "Total Expense (INR)", Value: totalExpense },
    ];

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summary);
    const detailSheet = XLSX.utils.json_to_sheet(details);

    summarySheet["!cols"] = [{ wch: 25 }, { wch: 25 }];
    detailSheet["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Expense Details");

    const fileDate = today;
    XLSX.writeFile(workbook, `Expense_Report_${fileDate}.xlsx`);

    setSuccess("Excel report downloaded successfully.");
  };

  // ==========================================
  // SCREEN
  // ==========================================
  return (
    <>
      <style>{`
        .expense-page {
          min-height: 100vh;
          padding: 26px;
          background: #f5f7fb;
          color: #1f2937;
          font-family: Inter, Arial, sans-serif;
          box-sizing: border-box;
        }

        .expense-page *,
        .expense-page *::before,
        .expense-page *::after {
          box-sizing: border-box;
        }

        .expense-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .expense-heading h2 {
          margin: 0 0 7px;
          color: #111827;
          font-size: 27px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .expense-heading p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .expense-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .expense-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 16px;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .expense-btn:hover {
          transform: translateY(-1px);
          filter: brightness(0.96);
        }

        .expense-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .expense-btn-primary {
          background: #8b1c1c;
          color: #fff;
        }

        .expense-btn-excel {
          background: #15803d;
          color: #fff;
        }

        .expense-btn-light {
          background: #fff;
          color: #374151;
          border-color: #d1d5db;
        }

        .expense-btn-danger {
          background: #fff1f2;
          color: #be123c;
          border-color: #fecdd3;
        }

        .expense-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .expense-summary-card {
          position: relative;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
          padding: 22px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.025);
        }

        .expense-summary-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #8b1c1c;
        }

        .expense-summary-card.green::after {
          background: #15803d;
        }

        .expense-summary-card.blue::after {
          background: #2563eb;
        }

        .expense-summary-label {
          color: #6b7280;
          font-size: 13px;
          font-weight: 550;
          margin-bottom: 12px;
        }

        .expense-summary-value {
          color: #111827;
          font-size: 27px;
          font-weight: 750;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .expense-summary-note {
          color: #9ca3af;
          font-size: 12px;
          margin-top: 8px;
        }

        .expense-panel {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
          padding: 22px;
          margin-bottom: 22px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.025);
        }

        .expense-panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .expense-panel-heading h3 {
          margin: 0;
          color: #111827;
          font-size: 17px;
          font-weight: 700;
        }

        .expense-panel-heading p {
          margin: 5px 0 0;
          color: #9ca3af;
          font-size: 12px;
        }

        .expense-filter-grid,
        .expense-form-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .expense-field {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 8px;
        }

        .expense-field label {
          color: #374151;
          font-size: 12px;
          font-weight: 650;
        }

        .expense-field input,
        .expense-field select {
          width: 100%;
          min-height: 43px;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          background: #fff;
          color: #111827;
          font-size: 13px;
          transition: 0.2s;
        }

        .expense-field input:focus,
        .expense-field select:focus {
          border-color: #8b1c1c;
          box-shadow: 0 0 0 3px rgba(139, 28, 28, 0.08);
        }

        .expense-filter-actions,
        .expense-form-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .expense-alert {
          padding: 13px 15px;
          border-radius: 9px;
          margin-bottom: 18px;
          font-size: 13px;
          line-height: 1.5;
        }

        .expense-alert-error {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .expense-alert-success {
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .expense-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .expense-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .expense-table thead th {
          padding: 14px 15px;
          background: #f9fafb;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .expense-table tbody td {
          padding: 15px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
          font-size: 13px;
          vertical-align: middle;
        }

        .expense-table tbody tr:last-child td {
          border-bottom: none;
        }

        .expense-table tbody tr:hover {
          background: #fcfcfd;
        }

        .expense-serial {
          color: #9ca3af;
          font-weight: 600;
        }

        .expense-branch {
          font-weight: 650;
          color: #1f2937;
        }

        .expense-category-badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 20px;
          color: #991b1b;
          background: #fef2f2;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
        }

        .expense-amount {
          color: #b91c1c !important;
          font-weight: 750;
          white-space: nowrap;
        }

        .expense-row-actions {
          display: flex;
          gap: 8px;
        }

        .expense-icon-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: #fff;
          cursor: pointer;
          font-size: 15px;
          transition: 0.2s;
        }

        .expense-icon-btn:hover {
          background: #f3f4f6;
        }

        .expense-icon-btn.delete:hover {
          color: #be123c;
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .expense-table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          padding-top: 18px;
          margin-top: 4px;
          border-top: 1px solid #e5e7eb;
        }

        .expense-record-count {
          color: #6b7280;
          font-size: 13px;
        }

        .expense-footer-total {
          color: #111827;
          font-size: 14px;
          font-weight: 650;
        }

        .expense-footer-total strong {
          margin-left: 8px;
          color: #b91c1c;
          font-size: 19px;
        }

        .expense-empty,
        .expense-loading {
          padding: 45px 15px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }

        .expense-empty-icon {
          display: block;
          margin-bottom: 10px;
          font-size: 30px;
        }

        .expense-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.55);
          overflow-y: auto;
        }

        .expense-modal {
          width: 100%;
          max-width: 650px;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .expense-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 22px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .expense-modal-header h3 {
          margin: 0;
          font-size: 19px;
          font-weight: 750;
          color: #111827;
        }

        .expense-modal-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .expense-modal-close {
          width: 35px;
          height: 35px;
          border: none;
          border-radius: 8px;
          background: #f3f4f6;
          color: #374151;
          cursor: pointer;
          font-size: 20px;
        }

        .expense-modal-body {
          padding: 24px;
        }

        .expense-amount-input-wrap {
          position: relative;
        }

        .expense-amount-input-wrap span {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 14px;
        }

        .expense-amount-input-wrap input {
          padding-left: 30px;
        }

        @media (max-width: 1000px) {
          .expense-page {
            padding: 20px;
          }

          .expense-filter-grid,
          .expense-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .expense-page {
            padding: 13px;
          }

          .expense-header {
            align-items: flex-start;
          }

          .expense-heading h2 {
            font-size: 23px;
          }

          .expense-actions {
            width: 100%;
          }

          .expense-actions .expense-btn {
            flex: 1;
            padding: 10px;
            font-size: 12px;
          }

          .expense-summary-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .expense-summary-card {
            padding: 18px;
          }

          .expense-summary-value {
            font-size: 24px;
          }

          .expense-panel {
            padding: 15px;
          }

          .expense-filter-grid,
          .expense-form-grid {
            grid-template-columns: 1fr;
          }

          .expense-filter-actions .expense-btn,
          .expense-form-actions .expense-btn {
            flex: 1;
          }

          .expense-modal-overlay {
            padding: 10px;
          }

          .expense-modal {
            max-height: calc(100vh - 20px);
          }

          .expense-modal-header,
          .expense-modal-body {
            padding: 17px;
          }

          .expense-table-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .expense-footer-total strong {
            display: block;
            margin: 6px 0 0;
          }
        }
      `}</style>

      <div className="expense-page">
        {/* PAGE HEADER */}
        <div className="expense-header">
          <div className="expense-heading">
            <h2>Expense Management</h2>
            <p>Manage branch expenses and download expense reports.</p>
          </div>

          <div className="expense-actions">
            <button
              type="button"
              className="expense-btn expense-btn-excel"
              onClick={handleExportExcel}
              disabled={loading || expenses.length === 0}
            >
              <span>⇩</span> Download Excel
            </button>

            <button
              type="button"
              className="expense-btn expense-btn-primary"
              onClick={openAddForm}
            >
              <span>＋</span> Add Expense
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="expense-alert expense-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="expense-alert expense-alert-success">
            {success}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="expense-summary-grid">
          <div className="expense-summary-card">
            <div className="expense-summary-label">
              Total Expenses
            </div>

            <div className="expense-summary-value">
              {formatCurrency(totalExpense)}
            </div>

            <div className="expense-summary-note">
              Based on currently loaded records
            </div>
          </div>

          <div className="expense-summary-card green">
            <div className="expense-summary-label">
              Total Records
            </div>

            <div className="expense-summary-value">
              {expenses.length}
            </div>

            <div className="expense-summary-note">
              Expense entries matching your filters
            </div>
          </div>

          <div className="expense-summary-card blue">
            <div className="expense-summary-label">
              Expense Categories
            </div>

            <div className="expense-summary-value">
              {uniqueCategories}
            </div>

            <div className="expense-summary-note">
              Unique categories in the current results
            </div>
          </div>
        </div>

        {/* FILTER PANEL */}
        <section className="expense-panel">
          <div className="expense-panel-heading">
            <div>
              <h3>Filter Expenses</h3>
              <p>Find expenses by branch, category, or date range.</p>
            </div>
          </div>

          <div className="expense-filter-grid">
            <div className="expense-field">
              <label htmlFor="filter-branch">Branch</label>

              <select
                id="filter-branch"
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

            <div className="expense-field">
              <label htmlFor="filter-category">Category</label>

              <input
                id="filter-category"
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="Search category"
              />
            </div>

            <div className="expense-field">
              <label htmlFor="filter-from">From Date</label>

              <input
                id="filter-from"
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                max={filters.to || undefined}
              />
            </div>

            <div className="expense-field">
              <label htmlFor="filter-to">To Date</label>

              <input
                id="filter-to"
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                min={filters.from || undefined}
              />
            </div>
          </div>

          <div className="expense-filter-actions">
            <button
              type="button"
              className="expense-btn expense-btn-light"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear Filters
            </button>

            <button
              type="button"
              className="expense-btn expense-btn-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              Search Expenses
            </button>
          </div>
        </section>

        {/* EXPENSE TABLE */}
        <section className="expense-panel">
          <div className="expense-panel-heading">
            <div>
              <h3>Expense Records</h3>
              <p>View, edit, and manage your expense entries.</p>
            </div>

            <span className="expense-record-count">
              {expenses.length} records
            </span>
          </div>

          {loading ? (
            <div className="expense-loading">
              Loading expense records...
            </div>
          ) : expenses.length === 0 ? (
            <div className="expense-empty">
              <span className="expense-empty-icon">📋</span>
              <strong>No expenses found</strong>
              <p>Try changing the filters or add a new expense.</p>
            </div>
          ) : (
            <>
              <div className="expense-table-wrap">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Branch</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Expense Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((expense, index) => (
                      <tr key={expense.id}>
                        <td className="expense-serial">
                          {index + 1}
                        </td>

                        <td>
                          <span className="expense-branch">
                            {expense.branch?.name ||
                              branches.find(
                                (branch) =>
                                  String(branch.id) ===
                                  String(expense.branchId)
                              )?.name ||
                              "N/A"}
                          </span>
                        </td>

                        <td>
                          <span className="expense-category-badge">
                            {expense.category || "Uncategorized"}
                          </span>
                        </td>

                        <td className="expense-amount">
                          {formatCurrency(expense.amount)}
                        </td>

                        <td>{formatDate(expense.date)}</td>

                        <td>
                          <div className="expense-row-actions">
                            <button
                              type="button"
                              className="expense-icon-btn"
                              title="Edit expense"
                              aria-label="Edit expense"
                              onClick={() => openEditForm(expense)}
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="expense-icon-btn delete"
                              title="Delete expense"
                              aria-label="Delete expense"
                              onClick={() => handleDelete(expense)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="expense-table-footer">
                <div className="expense-record-count">
                  Showing {expenses.length} expense record(s)
                </div>

                <div className="expense-footer-total">
                  Total Amount
                  <strong>{formatCurrency(totalExpense)}</strong>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ADD / EDIT MODAL */}
        {showForm && (
          <div
            className="expense-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
          >
            <div
              className="expense-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="expense-modal-title"
            >
              <div className="expense-modal-header">
                <div>
                  <h3 id="expense-modal-title">
                    {editingId !== null
                      ? "Edit Expense"
                      : "Add New Expense"}
                  </h3>

                  <p>
                    Enter the branch and expense details below.
                  </p>
                </div>

                <button
                  type="button"
                  className="expense-modal-close"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="expense-modal-body">
                  <div className="expense-form-grid">
                    <div className="expense-field">
                      <label htmlFor="form-branch">
                        Branch *
                      </label>

                      <select
                        id="form-branch"
                        name="branchId"
                        value={form.branchId}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select Branch</option>

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

                    <div className="expense-field">
                      <label htmlFor="form-category">
                        Expense Category *
                      </label>

                      <input
                        id="form-category"
                        type="text"
                        name="category"
                        value={form.category}
                        onChange={handleFormChange}
                        placeholder="e.g. Electricity"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="expense-field">
                      <label htmlFor="form-amount">
                        Amount (₹) *
                      </label>

                      <div className="expense-amount-input-wrap">
                        <span>₹</span>

                        <input
                          id="form-amount"
                          type="number"
                          name="amount"
                          value={form.amount}
                          onChange={handleFormChange}
                          placeholder="0.00"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="expense-field">
                      <label htmlFor="form-date">
                        Expense Date *
                      </label>

                      <input
                        id="form-date"
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="expense-form-actions">
                    <button
                      type="button"
                      className="expense-btn expense-btn-light"
                      onClick={closeForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="expense-btn expense-btn-primary"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingId !== null
                        ? "Update Expense"
                        : "Save Expense"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
