import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderController from "../../../controllers/order.controller";

const OrderList = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ============================================
  // LOAD ORDERS
  // ============================================
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (branchId) params.branchId = branchId;
      if (status) params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;

      if (search.trim()) {
        params.invoiceNumber = search.trim();
      }

      const response = await orderController.getAdminOrders(params);

      if (response.success) {
        setOrders(response.data || []);
      } else {
        setError(response.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("LOAD ADMIN ORDERS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GET BRANCHES FROM ORDERS
  // ============================================
  const extractBranches = (orderList) => {
    const branchMap = new Map();

    orderList.forEach((order) => {
      if (order.branch) {
        branchMap.set(order.branch.id, order.branch);
      }
    });

    setBranches(Array.from(branchMap.values()));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    extractBranches(orders);
  }, [orders]);

  // ============================================
  // SEARCH
  // ============================================
  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders();
  };

  // ============================================
  // CLEAR FILTERS
  // ============================================
  const clearFilters = () => {
    setSearch("");
    setBranchId("");
    setStatus("");
    setFrom("");
    setTo("");

    setTimeout(() => {
      loadOrders();
    }, 0);
  };

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================
  // STATUS CLASS
  // ============================================
  const getStatusClass = (statusValue) => {
    switch (statusValue) {
      case "COMPLETED":
        return "status-completed";

      case "DRAFT":
        return "status-draft";

      case "CANCELLED":
        return "status-cancelled";

      default:
        return "";
    }
  };

  return (
    <div className="admin-orders-page">

      {/* ========================================
          HEADER
      ======================================== */}
      <div className="orders-header">

        <div>
          <h1>Orders</h1>

          <p>
            View and manage orders across all branches
          </p>
        </div>

        <div className="orders-count">
          {orders.length} Orders
        </div>

      </div>

      {/* ========================================
          FILTERS
      ======================================== */}
      <div className="orders-filter-card">

        <form onSubmit={handleSearch}>

          <div className="orders-filter-grid">

            {/* SEARCH */}
            <div className="filter-field">

              <label>Invoice Number</label>

              <input
                type="text"
                placeholder="Search invoice..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            {/* BRANCH */}
            <div className="filter-field">

              <label>Branch</label>

              <select
                value={branchId}
                onChange={(e) =>
                  setBranchId(e.target.value)
                }
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

            {/* STATUS */}
            <div className="filter-field">

              <label>Status</label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >

                <option value="">
                  All Status
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="DRAFT">
                  Draft / Hold
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

              </select>

            </div>

            {/* FROM */}
            <div className="filter-field">

              <label>From Date</label>

              <input
                type="date"
                value={from}
                onChange={(e) =>
                  setFrom(e.target.value)
                }
              />

            </div>

            {/* TO */}
            <div className="filter-field">

              <label>To Date</label>

              <input
                type="date"
                value={to}
                onChange={(e) =>
                  setTo(e.target.value)
                }
              />

            </div>

            {/* BUTTONS */}
            <div className="orders-filter-actions">

              <button
                type="submit"
                className="orders-search-btn"
              >
                Search
              </button>

              <button
                type="button"
                className="orders-clear-btn"
                onClick={clearFilters}
              >
                Clear
              </button>

            </div>

          </div>

        </form>

      </div>

      {/* ========================================
          ERROR
      ======================================== */}
      {error && (
        <div className="orders-error">
          {error}
        </div>
      )}

      {/* ========================================
          LOADING
      ======================================== */}
      {loading ? (
        <div className="orders-loading">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (

        <div className="orders-empty">

          <div className="orders-empty-icon">
            🧾
          </div>

          <h3>No Orders Found</h3>

          <p>
            No orders match the selected filters.
          </p>

        </div>

      ) : (

        /* ======================================
           ORDER TABLE
        ====================================== */

        <div className="orders-table-card">

          <div className="orders-table-wrapper">

            <table className="orders-table">

              <thead>

                <tr>

                  <th>Invoice</th>

                  <th>Branch</th>

                  <th>Shift</th>

                  <th>Status</th>

                  <th>Payment</th>

                  <th>Items</th>

                  <th>Total</th>

                  <th>Date</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {orders.map((order) => (

                  <tr key={order.id}>

                    {/* INVOICE */}
                    <td>

                      <div className="invoice-cell">

                        <strong>
                          {order.invoiceNumber ||
                            order.holdNumber ||
                            "-"}
                        </strong>

                        {order.holdNumber &&
                          !order.invoiceNumber && (
                            <small>
                              HOLD
                            </small>
                          )}

                      </div>

                    </td>

                    {/* BRANCH */}
                    <td>
                      {order.branch?.name || "-"}
                    </td>

                    {/* SHIFT */}
                    <td>
                      {order.shift?.name || "-"}
                    </td>

                    {/* STATUS */}
                    <td>

                      <span
                        className={`order-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>

                    </td>

                    {/* PAYMENT */}
                    <td>
                      {order.paymentMethod || "-"}
                    </td>

                    {/* ITEMS */}
                    <td>
                      {order.items?.length || 0}
                    </td>

                    {/* TOTAL */}
                    <td>

                      <strong>
                        ₹
                        {Number(
                          order.totalAmount || 0
                        ).toFixed(2)}
                      </strong>

                    </td>

                    {/* DATE */}
                    <td>
                      {formatDate(
                        order.createdAt
                      )}
                    </td>

                    {/* ACTION */}
                    <td>

                      <button
                        className="order-view-btn"
                        onClick={() =>
                          navigate(
                            `/admin/orders/${order.id}`
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
};

export default OrderList;