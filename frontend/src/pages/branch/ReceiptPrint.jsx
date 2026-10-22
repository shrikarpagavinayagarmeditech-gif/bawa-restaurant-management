import React from "react";
import "./ReceiptPrint.css";

// File location: frontend/public/images/bawa-logo.png
// Files inside /public are served from the site root, so no "public" in the path.
const LOGO_SRC = "/images/bawa-logo.png";

const money = (value) =>
  `Rs. ${Number(value || 0).toFixed(2)}`;

export default function ReceiptPrint({ receipt }) {
  if (!receipt) return null;

  const branch = receipt.branch || {};
  const items = Array.isArray(receipt.items) ? receipt.items : [];

  return (
    <div id="receipt-print-root">
      <div className="thermal-receipt">
        {/* LOGO + BRANCH DETAILS */}
        <div className="receipt-header">
          <img className="receipt-logo" src={LOGO_SRC} alt="Bawa" />

          <h2>{branch.name || "BAWA RESTAURANT"}</h2>

          {branch.address && (
            <p className="receipt-address">{branch.address}</p>
          )}
          {branch.phone && <p>Mobile: {branch.phone}</p>}
          {branch.gstin && <p>GSTIN: {branch.gstin}</p>}
        </div>

        <p className="center receipt-title">INVOICE RECEIPT</p>

        <hr />

        <p>Invoice NO: {receipt.invoiceNumber}</p>
        <p>Date: {receipt.date}</p>
        <hr />

        <table className="receipt-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{money(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <div className="receipt-row">
          <span>Subtotal</span>
          <span>{money(receipt.subtotal)}</span>
        </div>

        {receipt.discountAmount > 0 && (
          <div className="receipt-row">
            <span>Discount</span>
            <span>-{money(receipt.discountAmount)}</span>
          </div>
        )}

        {/* <div className="receipt-row">
          <span>Taxable Amount</span>
          <span>{money(receipt.taxableAmount)}</span>
        </div> */}

        <div className="receipt-row">
          <span>CGST (2.5%)</span>
          <span>{money(receipt.cgst)}</span>
        </div>

        <div className="receipt-row">
          <span>SGST (2.5%)</span>
          <span>{money(receipt.sgst)}</span>
        </div>

        <hr />

        <div className="receipt-row receipt-grand-total">
          <strong>GRAND TOTAL</strong>
          <strong>{money(receipt.total)}</strong>
        </div>

        <hr />

        {/* <p>Payment Method: {receipt.paymentMethod}</p>

        {receipt.paymentMethod === "CASH" && (
          <p>Cash: {money(receipt.cashAmount)}</p>
        )}

        {receipt.paymentMethod === "UPI" && (
          <p>UPI: {money(receipt.upiAmount)}</p>
        )}

        {receipt.paymentMethod === "SPLIT" && (
          <>
            <p>Cash: {money(receipt.cashAmount)}</p>
            <p>UPI: {money(receipt.upiAmount)}</p>
          </>
        )} */}

      
<hr />

<div className="receipt-footer">
  <p className="center thank-you">
    Thank you! Visit Again
  </p>

  <p className="center receipt-tamil-message">
    ஆர்டரின் பெயரில் அணைத்து விசேஷங்களுக்கும் சமைத்து தரப்படும்
  </p>
</div>

      </div>
    </div>
  );
}