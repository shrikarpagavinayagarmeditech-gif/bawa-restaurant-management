import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderController from "../../../controllers/order.controller";

const OrderList = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    invoiceNumber: "",
    status: "",
    from: "",
    to: "",
  });

  const fetchOrders = async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await orderController.getBranchOrders(params);

      if (response?.success) {
        setOrders(response.data || []);
      } else {
        setOrders([]);
        setError(
          response?.message || "Failed to load orders"
        );
      }
    } catch (err) {
      console.error("Branch orders error:", err);

      setOrders([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = () => {
    const params = {};

    if (filters.invoiceNumber.trim()) {
      params.invoiceNumber =
        filters.invoiceNumber.trim();
    }

    if (filters.status) {
      params.status = filters.status;
    }

    if (filters.from) {
      params.from = filters.from;
    }

    if (filters.to) {
      params.to = filters.to;
    }

    fetchOrders(params);
  };

  const handleClear = () => {
    const clearedFilters = {
      invoiceNumber: "",
      status: "",
      from: "",
      to: "",
    };

    setFilters(clearedFilters);
    fetchOrders();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const getStatusClass = (status) => {
    if (status === "COMPLETED") {
      return "order-status status-completed";
    }

    if (status === "DRAFT") {
      return "order-status status-draft";
    }

    if (status === "CANCELLED") {
      return "order-status status-cancelled";
    }

    return "order-status";
  };

  const formatPayment = (order) => {
    if (!order.paymentMethod) {
      return "-";
    }

    if (order.paymentMethod === "SPLIT") {
      return "Split";
    }

    return order.paymentMethod;
  };

  return (
    <div className="admin-orders-page">
      {/* Header */}
      <div className="orders-header">
        <div>
          <h1>Orders</h1>
          <p>
            View and manage your branch orders
          </p>
        </div>

        <div className="orders-count">
          {orders.length} Orders
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filter-card">
        <div className="orders-filter-grid">
          <div className="filter-field">
            <label>Invoice Number</label>

            <input
              type="text"
              name="invoiceNumber"
              value={filters.invoiceNumber}
              onChange={handleChange}
              placeholder="Search invoice"
            />
          </div>

          <div className="filter-field">
            <label>Status</label>

            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
            >
              <option value="">All Status</option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="DRAFT">
                Draft
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          <div className="filter-field">
            <label>From Date</label>

            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleChange}
            />
          </div>

          <div className="filter-field">
            <label>To Date</label>

            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleChange}
            />
          </div>

          <div className="filter-field filter-actions">
            <button
              className="orders-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>

            <button
              className="orders-clear-btn"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="orders-table-card">
        {loading ? (
          <div className="orders-loading">
            Loading orders...
          </div>
        ) : error ? (
          <div className="orders-error">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            No orders found
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Hold No.</th>
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
                    <td className="invoice-cell">
                      {order.invoiceNumber || "-"}
                    </td>

                    <td>
                      {order.holdNumber || "-"}
                    </td>

                    <td>
                      {order.shift?.name || "-"}
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          order.status
                        )}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {formatPayment(order)}
                    </td>

                    <td>
                      {order.items?.length || 0}
                    </td>

                    <td>
                      ₹
                      {Number(
                        order.totalAmount || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      {formatDate(
                        order.createdAt
                      )}
                    </td>

                    <td>
                      <button
                        className="order-view-btn"
                        onClick={() =>
                          navigate(
                            `/branch/orders/${order.id}`
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
        )}
      </div>
    </div>
  );
};

export default OrderList;