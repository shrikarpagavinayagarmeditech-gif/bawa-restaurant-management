import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import orderController from "../../../controllers/order.controller";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // LOAD ORDER DETAILS
  // ============================================
  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await orderController.getAdminOrderById(id);

      if (response.success) {
        setOrder(response.data);
      } else {
        setError(
          response.message || "Failed to load order"
        );
      }
    } catch (err) {
      console.error(
        "LOAD ORDER DETAILS ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load order details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

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
  // FORMAT MONEY
  // ============================================
  const money = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  // ============================================
  // STATUS CLASS
  // ============================================
  const getStatusClass = (status) => {
    switch (status) {
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

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="admin-order-details-page">
        <div className="order-details-loading">
          Loading order details...
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (error) {
    return (
      <div className="admin-order-details-page">

        <button
          className="order-back-btn"
          onClick={() =>
            navigate("/admin/orders")
          }
        >
          ← Back to Orders
        </button>

        <div className="order-details-error">
          {error}
        </div>

      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="admin-order-details-page">

      {/* ========================================
          TOP HEADER
      ======================================== */}

      <div className="order-details-header">

        <div>

          <button
            className="order-back-btn"
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            ← Back to Orders
          </button>

          <h1>Order Details</h1>

          <p>
            View complete order information
          </p>

        </div>

        <div className="order-details-status">

          <span
            className={`order-status ${getStatusClass(
              order.status
            )}`}
          >
            {order.status}
          </span>

        </div>

      </div>

      {/* ========================================
          ORDER SUMMARY
      ======================================== */}

      <div className="order-info-grid">

        {/* INVOICE */}

        <div className="order-info-card">

          <span>Invoice Number</span>

          <strong>
            {order.invoiceNumber ||
              order.holdNumber ||
              "-"}
          </strong>

        </div>

        {/* BRANCH */}

        <div className="order-info-card">

          <span>Branch</span>

          <strong>
            {order.branch?.name || "-"}
          </strong>

        </div>

        {/* SHIFT */}

        <div className="order-info-card">

          <span>Shift</span>

          <strong>
            {order.shift?.name || "-"}
          </strong>

        </div>

        {/* PAYMENT */}

        <div className="order-info-card">

          <span>Payment Method</span>

          <strong>
            {order.paymentMethod || "-"}
          </strong>

        </div>

      </div>

      {/* ========================================
          ORDER META
      ======================================== */}

      <div className="order-meta-card">

        <div className="order-meta-item">

          <span>Created At</span>

          <strong>
            {formatDate(order.createdAt)}
          </strong>

        </div>

        <div className="order-meta-item">

          <span>Completed At</span>

          <strong>
            {formatDate(order.completedAt)}
          </strong>

        </div>

        {order.cancelledAt && (
          <div className="order-meta-item">

            <span>Cancelled At</span>

            <strong>
              {formatDate(order.cancelledAt)}
            </strong>

          </div>
        )}

      </div>

      {/* ========================================
          ITEMS
      ======================================== */}

      <div className="order-details-card">

        <div className="order-card-header">

          <div>
            <h2>Order Items</h2>

            <span>
              {order.items?.length || 0} Items
            </span>
          </div>

        </div>

        <div className="order-items-wrapper">

          <table className="order-items-table">

            <thead>

              <tr>

                <th>#</th>

                <th>Food Item</th>

                <th>Category</th>

                <th>Rate</th>

                <th>Quantity</th>

                <th>Amount</th>

              </tr>

            </thead>

            <tbody>

              {order.items?.map(
                (item, index) => (

                  <tr key={item.id}>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <div className="order-food-name">

                        {item.foodItem?.name ||
                          "-"}

                      </div>

                    </td>

                    <td>
                      {item.foodItem?.category
                        ?.name || "-"}
                    </td>

                    <td>
                      {money(item.rate)}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>

                      <strong>
                        {money(item.amount)}
                      </strong>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ========================================
          BILL SUMMARY
      ======================================== */}

      <div className="order-bottom-grid">

        {/* PAYMENT DETAILS */}

        <div className="order-details-card">

          <div className="order-card-header">

            <h2>Payment Details</h2>

          </div>

          <div className="payment-detail-list">

            <div>
              <span>Payment Method</span>

              <strong>
                {order.paymentMethod || "-"}
              </strong>
            </div>

            <div>
              <span>Cash Amount</span>

              <strong>
                {money(order.cashAmount)}
              </strong>
            </div>

            <div>
              <span>UPI Amount</span>

              <strong>
                {money(order.upiAmount)}
              </strong>
            </div>

          </div>

        </div>

        {/* AMOUNT SUMMARY */}

        <div className="order-details-card">

          <div className="order-card-header">

            <h2>Bill Summary</h2>

          </div>

          <div className="bill-summary-list">

            <div>
              <span>Subtotal</span>

              <strong>
                {money(order.subtotal)}
              </strong>
            </div>

            <div>
              <span>Discount</span>

              <strong>
                - {money(order.discountAmount)}
              </strong>
            </div>

            <div>
              <span>Taxable Amount</span>

              <strong>
                {money(order.taxableAmount)}
              </strong>
            </div>

            <div>
              <span>CGST</span>

              <strong>
                {money(order.cgstAmount)}
              </strong>
            </div>

            <div>
              <span>SGST</span>

              <strong>
                {money(order.sgstAmount)}
              </strong>
            </div>

            <div className="bill-total-row">

              <span>Total Amount</span>

              <strong>
                {money(order.totalAmount)}
              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================
          CANCELLATION
      ======================================== */}

      {order.status === "CANCELLED" &&
        order.cancellationReason && (

          <div className="order-cancellation-card">

            <h3>
              Cancellation Reason
            </h3>

            <p>
              {order.cancellationReason}
            </p>

          </div>

        )}

    </div>
  );
};

export default OrderDetails;