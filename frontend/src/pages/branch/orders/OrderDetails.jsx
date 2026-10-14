import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import orderController from "../../../controllers/order.controller";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await orderController.getBranchOrderById(id);

      if (response?.success) {
        setOrder(response.data);
      } else {
        setError(
          response?.message ||
            "Failed to load order details"
        );
      }
    } catch (err) {
      console.error(
        "Branch order details error:",
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
      fetchOrderDetails();
    }
  }, [id]);

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

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
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

  if (loading) {
    return (
      <div className="order-details-loading">
        Loading order details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-error">
        <p>{error}</p>

        <button
          className="order-back-btn"
          onClick={() =>
            navigate("/branch/orders")
          }
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-error">
        <p>Order not found.</p>

        <button
          className="order-back-btn"
          onClick={() =>
            navigate("/branch/orders")
          }
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="admin-order-details-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="order-details-header">

        <div>
          <button
            className="order-back-btn"
            onClick={() =>
              navigate("/branch/orders")
            }
          >
            ← Back to Orders
          </button>

          <h1>
            Order Details
          </h1>

          <p>
            {order.invoiceNumber ||
              order.holdNumber ||
              "Order"}
          </p>
        </div>

        <div>
          <span
            className={getStatusClass(
              order.status
            )}
          >
            {order.status}
          </span>
        </div>

      </div>


      {/* =====================================
          ORDER INFORMATION
      ===================================== */}

      <div className="order-info-grid">

        {/* Invoice */}

        <div className="order-info-card">
          <span className="order-info-label">
            Invoice Number
          </span>

          <strong>
            {order.invoiceNumber || "-"}
          </strong>
        </div>


        {/* Hold */}

        <div className="order-info-card">
          <span className="order-info-label">
            Hold Number
          </span>

          <strong>
            {order.holdNumber || "-"}
          </strong>
        </div>


        {/* Shift */}

        <div className="order-info-card">
          <span className="order-info-label">
            Shift
          </span>

          <strong>
            {order.shift?.name || "-"}
          </strong>
        </div>


        {/* Payment */}

        <div className="order-info-card">
          <span className="order-info-label">
            Payment Method
          </span>

          <strong>
            {order.paymentMethod || "-"}
          </strong>
        </div>

      </div>


      {/* =====================================
          ORDER META
      ===================================== */}

      <div className="order-meta-card">

        <div>
          <span>
            Created At
          </span>

          <strong>
            {formatDate(order.createdAt)}
          </strong>
        </div>

        <div>
          <span>
            Completed At
          </span>

          <strong>
            {formatDate(order.completedAt)}
          </strong>
        </div>

        <div>
          <span>
            Cancelled At
          </span>

          <strong>
            {formatDate(order.cancelledAt)}
          </strong>
        </div>

      </div>


      {/* =====================================
          ORDER ITEMS
      ===================================== */}

      <div className="order-details-card">

        <div className="order-card-header">
          <div>
            <h2>
              Order Items
            </h2>

            <p>
              {order.items?.length || 0} items
            </p>
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
                      <strong>
                        {item.foodItem?.name ||
                          "-"}
                      </strong>
                    </td>

                    <td>
                      {item.foodItem?.category
                        ?.name || "-"}
                    </td>

                    <td>
                      {formatAmount(
                        item.rate
                      )}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>
                      <strong>
                        {formatAmount(
                          item.amount
                        )}
                      </strong>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================
          PAYMENT + BILL SUMMARY
      ===================================== */}

      <div className="order-bottom-grid">

        {/* PAYMENT */}

        <div className="order-details-card">

          <div className="order-card-header">
            <h2>
              Payment Details
            </h2>
          </div>

          <div className="payment-detail-list">

            <div>
              <span>
                Payment Method
              </span>

              <strong>
                {order.paymentMethod ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Cash Amount
              </span>

              <strong>
                {formatAmount(
                  order.cashAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                UPI Amount
              </span>

              <strong>
                {formatAmount(
                  order.upiAmount
                )}
              </strong>
            </div>

          </div>

        </div>


        {/* BILL SUMMARY */}

        <div className="order-details-card">

          <div className="order-card-header">
            <h2>
              Bill Summary
            </h2>
          </div>

          <div className="bill-summary-list">

            <div>
              <span>
                Subtotal
              </span>

              <strong>
                {formatAmount(
                  order.subtotal
                )}
              </strong>
            </div>


            <div>
              <span>
                Discount
              </span>

              <strong>
                {formatAmount(
                  order.discountAmount
                )}
              </strong>
            </div>


            <div>
              <span>
                Taxable Amount
              </span>

              <strong>
                {formatAmount(
                  order.taxableAmount
                )}
              </strong>
            </div>


            <div>
              <span>
                CGST
              </span>

              <strong>
                {formatAmount(
                  order.cgstAmount
                )}
              </strong>
            </div>


            <div>
              <span>
                SGST
              </span>

              <strong>
                {formatAmount(
                  order.sgstAmount
                )}
              </strong>
            </div>


            <div className="bill-total-row">
              <span>
                Total
              </span>

              <strong>
                {formatAmount(
                  order.totalAmount
                )}
              </strong>
            </div>

          </div>

        </div>

      </div>


      {/* =====================================
          CANCELLATION REASON
      ===================================== */}

      {order.status === "CANCELLED" &&
        order.cancellationReason && (
          <div className="order-cancellation-card">

            <h2>
              Cancellation Reason
            </h2>

            <p>
              {order.cancellationReason}
            </p>

          </div>
        )}

    </div>
  );
};

export default OrderDetails;