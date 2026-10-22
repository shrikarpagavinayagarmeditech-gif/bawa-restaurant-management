import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
// import qz from "qz-tray";
import api from "../../api/api.js";

import {
  getTodayBillingSummary,
  holdBilling,
  getHeldBilling,
  getDraftBilling,
  updateDraftBilling,
  completeBilling,
  cancelBilling,
} from "../../controllers/billing.controller.js";

import ReceiptPrint from "./ReceiptPrint.jsx";
import "./Billing.css";
import html2canvas from "html2canvas";

const LOGO_SRC = "/images/bawa-logo.png";

// Leave empty to use the Windows default printer,
// or set the exact printer name, e.g. "POS-80".
const PRINTER_NAME = "";

// Receipt paper width in mm (80mm paper -> 72, 58mm paper -> 48)
const PAPER_WIDTH_MM = 72;

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const rs = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getMenuArray = (response) => {
  const root = response?.data;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data?.menu)) return root.data.menu;
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root?.menu)) return root.menu;
  if (Array.isArray(root?.foodItems)) return root.foodItems;
  if (Array.isArray(root?.items)) return root.items;
  return [];
};

const getFoodId = (item) =>
  item?.id || item?.foodItemId || item?.foodItem?.id;

const getFoodName = (item) =>
  item?.name || item?.foodItem?.name || "Food Item";

const getFoodPrice = (item) =>
  Number(
    item?.effectiveRate ??
      item?.branchRate ??
      item?.rate ??
      item?.price ??
      item?.defaultRate ??
      item?.foodItem?.effectiveRate ??
      item?.foodItem?.branchRate ??
      item?.foodItem?.rate ??
      item?.foodItem?.defaultRate ??
      0
  );

// const getFoodImage = (item) => {
//   const image =
//     item?.imageUrl ||
//     item?.image ||
//     item?.foodItem?.imageUrl ||
//     item?.foodItem?.image ||
//     null;

//   if (!image) return null;

//   if (/^data:/i.test(image)) return image;

//   try {
//     const url = new URL(image, window.location.origin);

//     if (
//       ["localhost", "127.0.0.1"].includes(url.hostname) ||
//       url.hostname === window.location.hostname
//     ) {
//       return `${url.pathname}${url.search}${url.hash}`;
//     }

//     if (/^https?:\/\//i.test(image)) return image;

//     return image.startsWith("/") ? image : `/${image}`;
//   } catch {
//     return image.startsWith("/") ? image : `/${image}`;
//   }
// };


const API_ORIGIN = "https://bawa.quiltoaiapps.com";

const getFoodImage = (item) => {
  const image =
    item?.imageUrl ||
    item?.image ||
    item?.foodItem?.imageUrl ||
    item?.foodItem?.image ||
    null;

  if (!image || typeof image !== "string") return null;

  // Preserve embedded images
  if (/^data:/i.test(image)) return image;

  // Preserve complete external URLs
  if (/^https?:\/\//i.test(image)) return image;

  // Convert relative upload paths to backend URLs
  const path = image.replace(/^\/+/, "");

  return `${API_ORIGIN}/${path}`;
};


const getFoodCategory = (item) =>
  item?.category || item?.foodItem?.category || null;

const getUserFromStorage = () => {
  try {
    for (const key of ["user", "currentUser", "authUser", "userData"]) {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed) return parsed;
      }
    }
  } catch (error) {
    console.error("User storage read error:", error);
  }
  return null;
};

const getFoodType = (item) => {
  const value =
    item?.foodType ??
    item?.type ??
    item?.foodCategoryType ??
    item?.isVeg ??
    item?.is_veg ??
    item?.foodItem?.foodType ??
    item?.foodItem?.type ??
    item?.foodItem?.isVeg ??
    item?.foodItem?.is_veg;

  const normalized = String(value).toLowerCase();

  if (
    value === true ||
    value === 1 ||
    normalized === "true" ||
    normalized === "veg" ||
    normalized === "vegetarian"
  )
    return "VEG";

  if (
    value === false ||
    value === 0 ||
    normalized === "false" ||
    normalized === "non-veg" ||
    normalized === "nonveg" ||
    normalized === "non_veg"
  )
    return "NON_VEG";

  return "UNKNOWN";
};

// Branch details printed at the top of the receipt (below the logo).
const getBranchInfo = (user) => {
  const b = user?.branch || {};

  const address =
    b.address ||
    user?.branchAddress ||
    [b.addressLine1, b.addressLine2, b.city, b.state, b.pincode]
      .filter(Boolean)
      .join(", ");

  return {
    name: b.name || user?.branchName || "",
    address: address || "",
    phone: b.phone || b.mobile || user?.branchPhone || "",
    gstin: b.gstin || b.gstNumber || "",
  };
};

// Convert the logo to a base64 data URI (QZ Tray cannot load relative URLs)
const loadLogoAsDataUri = async () => {
  try {
    const res = await fetch(LOGO_SRC);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Self-contained receipt HTML with inline styles (for QZ Tray)
const buildReceiptHtml = (receipt, logoDataUri) => {
  const branch = receipt.branch || {};
  const items = Array.isArray(receipt.items) ? receipt.items : [];

  const row = (left, right, bold = false) => `
    <div style="display:flex;justify-content:space-between;${
      bold ? "font-weight:bold;font-size:14px;" : ""
    }">
      <span>${left}</span><span>${right}</span>
    </div>`;

  const hr = `<hr style="border:0;border-top:1px dashed #000;margin:6px 0;" />`;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:2px 0;word-break:break-word;">${escapeHtml(item.name)}</td>
        <td style="padding:2px 0;text-align:center;">${item.quantity}</td>
        <td style="padding:2px 0;text-align:right;">${rs(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  let paymentLines = "";
  if (receipt.paymentMethod === "CASH") {
    paymentLines = `<div>Cash: ${rs(receipt.cashAmount)}</div>`;
  } else if (receipt.paymentMethod === "UPI") {
    paymentLines = `<div>UPI: ${rs(receipt.upiAmount)}</div>`;
  } else if (receipt.paymentMethod === "SPLIT") {
    paymentLines = `<div>Cash: ${rs(receipt.cashAmount)}</div><div>UPI: ${rs(
      receipt.upiAmount
    )}</div>`;
  }

  return `
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;">
    <div style="width:${PAPER_WIDTH_MM}mm;font-family:'Courier New',monospace;font-size:12px;color:#000;padding:2mm;box-sizing:border-box;">

      <div style="text-align:center;">
        ${
          logoDataUri
            ? `<img src="${logoDataUri}" style="width:40mm;max-width:100%;display:block;margin:0 auto 4px;" />`
            : ""
        }
        <div style="font-size:15px;font-weight:bold;">${escapeHtml(
          branch.name || "BAWA RESTAURANT"
        )}</div>
        ${branch.address ? `<div>${escapeHtml(branch.address)}</div>` : ""}
        ${branch.phone ? `<div>Ph: ${escapeHtml(branch.phone)}</div>` : ""}
        ${branch.gstin ? `<div>GSTIN: ${escapeHtml(branch.gstin)}</div>` : ""}
      </div>

      <div style="text-align:center;font-weight:bold;margin-top:6px;">PAYMENT RECEIPT</div>
      ${hr}

   <div>Invoice: ${escapeHtml(receipt.invoiceNumber)}</div>
<div>Date: ${escapeHtml(receipt.date)}</div>
      
      ${hr}

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${hr}

      ${row("Subtotal", rs(receipt.subtotal))}
      ${
        receipt.discountAmount > 0
          ? row("Discount", `-${rs(receipt.discountAmount)}`)
          : ""
      }
     
      ${row("CGST (2.5%)", rs(receipt.cgst))}
      ${row("SGST (2.5%)", rs(receipt.sgst))}
      ${hr}
      ${row("GRAND TOTAL", rs(receipt.total), true)}
      ${hr}

      
     
      ${hr}

     <div style="text-align:center; white-space:nowrap; font-weight:bold; margin-top:8px;">
  Thank you! Visit Again
</div>

<div style="text-align:center; font-size:10px; line-height:1.5; margin-top:6px;">
  ஆர்டரின் பெயரில் அணைத்து விசேஷங்களுக்கும் சமைத்து தரப்படும்
</div>
    </div>
  </body>
</html>`;
};

function Billing() {
  // Menu
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [foodType, setFoodType] = useState("ALL");
  const [serviceMode, setServiceMode] = useState("DINE_IN");
  const searchInputRef = useRef(null);

  // Cart
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");

  // Summary and held bills
  const [summary, setSummary] = useState({
    bills: 0,
    sales: 0,
    cash: 0,
    upi: 0,
    outstanding: 0,
  });
  const [heldBills, setHeldBills] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Current bill
  const [draftId, setDraftId] = useState(null);
  const [holdNumber, setHoldNumber] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(null);

  // Printing
  const [printPayload, setPrintPayload] = useState(null);
  const printedInvoiceRef = useRef(null);
  const logoDataUriRef = useRef(null);

  const user = useMemo(() => getUserFromStorage(), []);

  // Preload the logo (as base64) so it is ready before printing.
  useEffect(() => {
    const img = new Image();
    img.src = LOGO_SRC;

    loadLogoAsDataUri().then((uri) => {
      logoDataUriRef.current = uri;
    });
  }, []);

  // Direct print through QZ Tray; falls back to the browser print dialog.
  


const printReceipt = async (receipt) => {
  let printContainer = null;
  let root = null;

  try {
    // Create a hidden container.
    printContainer = document.createElement("div");

    Object.assign(printContainer.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "72mm",
      background: "#ffffff",
      zIndex: "-1",
    });

    document.body.appendChild(printContainer);

    // Render the React receipt component.
    root = createRoot(printContainer);
    root.render(<ReceiptPrint receipt={receipt} />);

    // Wait for React to render.
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Wait for the logo and other images to load.
    const images = Array.from(
      printContainer.querySelectorAll("img")
    );

    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    // Wait for fonts to load.
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const receiptElement =
      printContainer.querySelector(".thermal-receipt");

    if (!receiptElement) {
      throw new Error("Receipt component could not be rendered.");
    }

    // Convert the styled receipt into an image.
    const canvas = await html2canvas(receiptElement, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      logging: false,
    });

    const base64 = canvas
      .toDataURL("image/png")
      .split(",")[1];

    // Send the image directly to the printer bridge.
    const response = await fetch("http://localhost:9100/print", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cut: true,
        paperWidth: 80, // Change to 58 for a 58mm printer.
        reference: String(receipt.invoiceNumber || ""),
        content: [
          {
            type: "image",
            base64,
            align: "center",
          },
          {
            type: "feed",
            lines: 3,
          },
        ],
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
          result.detail ||
          `Print failed with status ${response.status}`
      );
    }

    console.log("Receipt printed successfully:", result);
    return true;
  } catch (error) {
    console.error("Thermal printing failed:", error);

    alert(
      `Receipt printing failed: ${error.message}. Check the Android print bridge and Bluetooth printer.`
    );

    return false;
  } finally {
    // Clean up only after image capture and print submission.
    if (root) {
      root.unmount();
    }

    if (printContainer) {
      printContainer.remove();
    }
  }
};




  // Print only after a successful completion and a known invoice number.
 

  // Print after successful billing, then start a new bill.
  useEffect(() => {
    if (!printPayload?.invoiceNumber) return;

    const invoiceKey = String(printPayload.invoiceNumber);

    if (printedInvoiceRef.current === invoiceKey) return;

    // Prevent duplicate print requests.
    printedInvoiceRef.current = invoiceKey;

    let cancelled = false;

    const printAndStartNewBill = async () => {
      const printed = await printReceipt(printPayload);

      if (cancelled) return;

      if (printed) {
        // Reset the completed bill after printing succeeds.
        startNewBill();
      } else {
        // Keep the completed bill on screen if printing fails.
        // The cashier can retry printing without losing the invoice.
        alert(
          `Invoice ${invoiceKey} is completed, but printing failed.`
        );
      }
    };

    void printAndStartNewBill();

    return () => {
      cancelled = true;
    };
  }, [printPayload]);



  // // Disconnect QZ when leaving the page
  // useEffect(() => {
  //   return () => {
  //     try {
  //       if (qz.websocket.isActive()) qz.websocket.disconnect();
  //     } catch {
  //       /* ignore */
  //     }
  //   };
  // }, []);

  // Load menu
  const loadMenu = async () => {
    try {
      const response = await api.get("/branch/menu");
      const items = getMenuArray(response);
      setMenuItems(items);

      const categoryMap = new Map();

      items.forEach((item) => {
        const category = getFoodCategory(item);
        if (category?.id) categoryMap.set(String(category.id), category);
      });

      setCategories(Array.from(categoryMap.values()));
    } catch (error) {
      console.error("Menu error:", error);
    }
  };

  // Load today's summary
  const loadSummary = async () => {
    try {
      const response = await getTodayBillingSummary();
      const data = response?.data || response || {};

      setSummary({
        bills: Number(data.bills ?? data.totalBills ?? data.completedBills ?? 0),
        sales: Number(data.sales ?? data.totalSales ?? data.totalAmount ?? 0),
        cash: Number(data.cash ?? data.cashAmount ?? 0),
        upi: Number(data.upi ?? data.upiAmount ?? 0),
        outstanding: Number(data.outstanding ?? 0),
      });
    } catch (error) {
      console.error("Summary error:", error);
    }
  };

  // Load held bills
  const loadHeldBills = async () => {
    try {
      const response = await getHeldBilling();
      const data = response?.data || response || [];
      setHeldBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Held bills error:", error);
    }
  };

  // Initial loading
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      await Promise.all([loadMenu(), loadSummary(), loadHeldBills()]);
      if (mounted) setLoading(false);
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F3") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "F9") {
        event.preventDefault();
        if (cart.length > 0 && !invoiceNumber) openPaymentModal();
      }

      if (event.key === "Escape") {
        setShowPayment(false);
        setShowHeldBills(false);
        setShowCancel(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, invoiceNumber]);

  // Filter menu
  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const name = getFoodName(item).toLowerCase();
      const category = getFoodCategory(item);
      const categoryId =
        category?.id || item?.categoryId || item?.foodItem?.categoryId;

      const matchesSearch = !query || name.includes(query);
      const matchesCategory =
        selectedCategory === "ALL" ||
        String(categoryId) === String(selectedCategory);

      const type = getFoodType(item);
      const matchesType =
        foodType === "ALL" ||
        (foodType === "VEG" && type === "VEG") ||
        (foodType === "NON_VEG" && type === "NON_VEG");

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [menuItems, search, selectedCategory, foodType]);

  // Totals
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const discountAmount = Math.min(
    Math.max(Number(discount || 0), 0),
    subtotal
  );
  const taxableAmount = subtotal - discountAmount;
  const cgst = taxableAmount * 0.025;
  const sgst = taxableAmount * 0.025;
  const total = taxableAmount + cgst + sgst;

  // Add food item
  const addToCart = (item) => {
    if (invoiceNumber) return;

    const id = getFoodId(item);
    if (id == null) return;

    const price = getFoodPrice(item);
    if (!Number.isFinite(price) || price < 0) return;

    setCart((current) => {
      const existing = current.find((x) => String(x.id) === String(id));

      if (existing) {
        return current.map((x) =>
          String(x.id) === String(id)
            ? { ...x, quantity: Number(x.quantity || 0) + 1 }
            : x
        );
      }

      return [
        ...current,
        {
          id: String(id),
          name: getFoodName(item),
          price,
          quantity: 1,
          image: getFoodImage(item),
        },
      ];
    });
  };

  const changeQuantity = (id, amount) => {
    if (invoiceNumber) return;

    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta === 0) return;

    setCart((current) =>
      current.reduce((next, item) => {
        if (String(item.id) !== String(id)) {
          next.push(item);
          return next;
        }

        const quantity = Math.max(0, Number(item.quantity || 0) + delta);
        if (quantity > 0) next.push({ ...item, quantity });
        return next;
      }, [])
    );
  };

  const decreaseQuantity = (id) => changeQuantity(id, -1);
  const increaseQuantity = (id) => changeQuantity(id, 1);

  const removeItem = (id) => {
    if (invoiceNumber) return;
    setCart((current) =>
      current.filter((item) => String(item.id) !== String(id))
    );
  };

  const clearBill = () => {
    if (!cart.length && !draftId) return;

    if (!window.confirm("Clear current bill?")) return;

    setCart([]);
    setDiscount("");
    setDraftId(null);
    setHoldNumber(null);
    setCashAmount("");
    setUpiAmount("");
    setPaymentMethod("CASH");
  };

  const startNewBill = () => {
    setCart([]);
    setDiscount("");
    setCashAmount("");
    setUpiAmount("");
    setPaymentMethod("CASH");
    setDraftId(null);
    setHoldNumber(null);
    setInvoiceNumber(null);
    setPrintPayload(null);
    setCancelReason("");
  };

  // Payment method selection
  const selectPayment = (method) => {
    setPaymentMethod(method);

    const amount = Number(total.toFixed(2));

    if (method === "CASH") {
      setCashAmount(String(amount));
      setUpiAmount("");
    } else if (method === "UPI") {
      setCashAmount("");
      setUpiAmount(String(amount));
    } else {
      setCashAmount("");
      setUpiAmount("");
    }
  };

  const openPaymentModal = () => {
    selectPayment("CASH");
    setShowPayment(true);
  };

  // Hold bill
  const handleHold = async () => {
    if (!cart.length) {
      alert("Please add food items.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        items: cart.map((item) => ({
          foodItemId: item.id,
          quantity: item.quantity,
        })),
        discountAmount,
      };

      const response = draftId
        ? await updateDraftBilling({ id: draftId, ...payload })
        : await holdBilling(payload);

      const data = response?.data || response || {};
      const order = data?.order || data;

      setDraftId(data?.id || order?.id || null);
      setHoldNumber(data?.holdNumber || order?.holdNumber || null);

      await loadHeldBills();

      alert(
        data?.holdNumber || order?.holdNumber
          ? `${data?.holdNumber || order?.holdNumber} held successfully.`
          : "Bill held successfully."
      );
    } catch (error) {
      console.error("Hold error:", error);
      alert(error.response?.data?.message || "Unable to hold bill.");
    } finally {
      setSaving(false);
    }
  };

  // Resume held bill
  const resumeBill = async (bill) => {
    try {
      setSaving(true);

      const response = await getDraftBilling(bill.id);
      const data = response?.data || response || {};
      const order = data?.order || data;
      const items = order?.items || order?.orderItems || [];

      const restored = items.map((item) => {
        const food = item?.foodItem || item?.food || {};

        return {
          id: String(item?.foodItemId || food?.id || item?.id || ""),
          name: food?.name || item?.name || "Food Item",
          price: Number(
            item?.unitPrice ??
              item?.price ??
              food?.rate ??
              food?.defaultRate ??
              0
          ),
          quantity: Number(item?.quantity || 1),
          image: getFoodImage(food),
        };
      });

      setCart(restored);
      setDiscount(Number(order?.discountAmount || 0) || "");
      setDraftId(order?.id || bill.id);
      setHoldNumber(order?.holdNumber || bill?.holdNumber || null);
      setInvoiceNumber(null);
      setPrintPayload(null);
      setShowHeldBills(false);
    } catch (error) {
      console.error("Resume error:", error);
      alert(error.response?.data?.message || "Unable to resume bill.");
    } finally {
      setSaving(false);
    }
  };

  // Delete a held draft using the existing cancel endpoint
  const deleteHeldBill = async (bill) => {
    const label = bill?.holdNumber || "this held bill";

    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    try {
      setSaving(true);

      await cancelBilling({
        id: bill.id,
        cancellationReason: "Deleted from held bills",
      });

      if (String(draftId) === String(bill.id)) {
        setCart([]);
        setDiscount("");
        setDraftId(null);
        setHoldNumber(null);
        setCashAmount("");
        setUpiAmount("");
      }

      await loadHeldBills();
      alert(`${label} deleted.`);
    } catch (error) {
      console.error("Delete held bill error:", error);
      alert(error.response?.data?.message || "Unable to delete held bill.");
    } finally {
      setSaving(false);
    }
  };

  // Complete payment and prepare receipt only after API success
  const handleComplete = async () => {
    if (!cart.length) {
      alert("Please add food items.");
      return;
    }

    const amount = Number(total.toFixed(2));
    const cash = Number(cashAmount || 0);
    const upi = Number(upiAmount || 0);

    if (paymentMethod === "CASH" && Math.abs(cash - amount) > 0.01) {
      alert(`Cash amount must be ${money(amount)}.`);
      return;
    }

    if (paymentMethod === "UPI" && Math.abs(upi - amount) > 0.01) {
      alert(`UPI amount must be ${money(amount)}.`);
      return;
    }

    if (
      paymentMethod === "SPLIT" &&
      (cash < 0 || upi < 0 || Math.abs(cash + upi - amount) > 0.01)
    ) {
      alert(`Cash + UPI must equal ${money(amount)}.`);
      return;
    }

    try {
      setSaving(true);

      let currentId = draftId;

      if (!currentId) {
        const holdResponse = await holdBilling({
          items: cart.map((item) => ({
            foodItemId: item.id,
            quantity: item.quantity,
          })),
          discountAmount,
        });

        const holdData = holdResponse?.data || holdResponse || {};
        currentId = holdData?.id || holdData?.order?.id;
      }

      if (!currentId) {
        throw new Error("The backend did not return an order ID.");
      }

      const completeResponse = await completeBilling({
        id: currentId,
        paymentMethod,
        cashAmount:
          paymentMethod === "CASH" || paymentMethod === "SPLIT" ? cash : 0,
        upiAmount:
          paymentMethod === "UPI" || paymentMethod === "SPLIT" ? upi : 0,
      });

      const completeData = completeResponse?.data || completeResponse || {};

      const completedOrder =
        completeData?.order || completeData?.data?.order || completeData;

      const generatedInvoiceNumber =
        completeData?.invoiceNumber ||
        completeData?.data?.invoiceNumber ||
        completedOrder?.invoiceNumber ||
        null;

      // Preserve the completed bill on screen.
      setInvoiceNumber(generatedInvoiceNumber);

      // Prepare receipt only when the completion API succeeded
      // and supplied a usable invoice number.
      if (generatedInvoiceNumber) {
        setPrintPayload({
          invoiceNumber: generatedInvoiceNumber,
          branch: getBranchInfo(user),
          date: new Date().toLocaleString("en-IN"),
          serviceMode,
          cashier: user?.name || user?.username || "Branch User",
          items: cart.map((item) => ({ ...item })),
          subtotal,
          discountAmount,
          taxableAmount,
          cgst,
          sgst,
          total,
          paymentMethod,
          cashAmount:
            paymentMethod === "CASH" || paymentMethod === "SPLIT" ? cash : 0,
          upiAmount:
            paymentMethod === "UPI" || paymentMethod === "SPLIT" ? upi : 0,
        });
      }

      setShowPayment(false);

      alert(
        generatedInvoiceNumber
          ? `Bill completed successfully.\nInvoice No: ${generatedInvoiceNumber}`
          : "Bill completed successfully, but no invoice number was returned. Receipt was not auto-printed."
      );

      await Promise.all([loadSummary(), loadHeldBills()]);
    } catch (error) {
      console.error("Complete error:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to complete bill."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel bill
  const handleCancel = async () => {
    if (!draftId) {
      setShowCancel(false);
      clearBill();
      return;
    }

    if (!cancelReason.trim()) {
      alert("Please enter cancellation reason.");
      return;
    }

    try {
      setSaving(true);

      await cancelBilling({
        id: draftId,
        cancellationReason: cancelReason.trim(),
      });

      setCart([]);
      setDiscount("");
      setDraftId(null);
      setHoldNumber(null);
      setInvoiceNumber(null);
      setPrintPayload(null);
      setCancelReason("");
      setShowCancel(false);

      await loadHeldBills();
      alert("Bill cancelled successfully.");
    } catch (error) {
      console.error("Cancel error:", error);
      alert(error.response?.data?.message || "Unable to cancel bill.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="billing-loading">
        <div className="billing-spinner" />
        <h3>Loading Billing</h3>
        <p>Loading branch menu...</p>
      </div>
    );
  }

  return (
    <div className="bawa-pos">
      {/* Print-only receipt (used only as browser-print fallback) */}
      <ReceiptPrint receipt={printPayload} />

      <header className="pos-header">
        <div className="pos-logo-area">
          <div className="pos-logo">B</div>
          <div>
            <strong>BAWA</strong>
            <span>RESTAURANT MANAGEMENT</span>
          </div>
        </div>

        <div className="pos-header-info">
          <div className="header-pill">▣ Branch</div>
          <div className="header-pill">● Active Shift</div>

          {/* <button
            type="button"
            className="held-header-btn"
            onClick={() => setShowHeldBills(true)}
          >
            ⏸ Held Bills
            {heldBills.length > 0 && <b>{heldBills.length}</b>}
          </button> */}
        </div>

        <div className="pos-header-right">
          <div className="header-search">
            ⌕
            <input
              ref={searchInputRef}
              placeholder="Search dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>F3</kbd>
          </div>

          <div className="sync-status">
            <i /> SYNCED
          </div>

          <div className="cashier-info">
            <div>
              <strong>{user?.name || user?.username || "Branch User"}</strong>
              <span>{user?.role || "BRANCH"}</span>
            </div>
            <div className="cashier-avatar">
              {(user?.name || user?.username || "B")[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="pos-main">
        <section className="menu-panel">
          <div className="service-tabs">
            {[
              ["DINE_IN", "🍽 Dine In"],
              ["TAKEAWAY", "🛍 Takeaway"],
              ["ONLINE", "⇄ Online"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={serviceMode === value ? "active" : ""}
                onClick={() => setServiceMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="food-search">
            <span>⌕</span>
            <input
              placeholder="Search food item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                ×
              </button>
            )}
          </div>

          <div className="category-row">
            <button
              type="button"
              className={selectedCategory === "ALL" ? "active" : ""}
              onClick={() => setSelectedCategory("ALL")}
            >
              All Items <span>{menuItems.length}</span>
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={
                  String(selectedCategory) === String(category.id)
                    ? "active"
                    : ""
                }
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="food-grid">
            {filteredMenu.length === 0 ? (
              <div className="menu-empty">
                <div>🍽️</div>
                <strong>No food items found</strong>
                <span>
                  {menuItems.length === 0
                    ? "No menu items available for this branch."
                    : "Try another search or category."}
                </span>
              </div>
            ) : (
              filteredMenu.map((item, index) => {
                const id = getFoodId(item);
                const price = getFoodPrice(item);
                const image = getFoodImage(item);
                const cartItem = cart.find((x) => String(x.id) === String(id));

                return (
                  <article
                    className="food-card"
                    key={String(id ?? index)}
                    onClick={() => addToCart(item)}
                  >
                    <div className="food-card-top">
                      <span>#{String(index + 1).padStart(2, "0")}</span>
                      <i>●</i>
                    </div>

                    <div className="food-image">
                      {image ? (
                        <img src={image} alt={getFoodName(item)} />
                      ) : (
                        <div className="food-placeholder">🍛</div>
                      )}
                      {cartItem && (
                        <span className="cart-count">{cartItem.quantity}</span>
                      )}
                    </div>

                    <div className="food-details">
                      <strong>{getFoodName(item)}</strong>
                      <span>{getFoodCategory(item)?.name || "Food"}</span>
                    </div>

                    <div className="food-card-bottom">
                      <b>{money(price)}</b>
                      <button
                        type="button"
                        disabled={!!invoiceNumber}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                      >
                        + ADD
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="bill-panel">
          <div className="bill-header">
            <div>
              <h2>
                {invoiceNumber
                  ? `INVOICE ${invoiceNumber}`
                  : holdNumber
                    ? `HOLD ${holdNumber}`
                    : "BILL #NEW"}
              </h2>
              <span>
                {invoiceNumber
                  ? "Completed Bill"
                  : holdNumber
                    ? "Held Bill"
                    : "Current Bill"}
              </span>
            </div>

            {invoiceNumber ? (
              <button
                type="button"
                className="new-bill-btn"
                onClick={startNewBill}
              >
                🧾 New Bill
              </button>
            ) : (
              <button type="button" onClick={clearBill}>
                Clear
              </button>
            )}
          </div>

          <div className="bill-items">
            {cart.length === 0 ? (
              <div className="bill-empty">
                <div>🛒</div>
                <strong>No items added</strong>
                <span>Select items from the menu to start a new bill.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div className="bill-item" key={item.id}>
                  <div className="bill-item-main">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{money(item.price)} each</span>
                    </div>
                    <button
                      type="button"
                      disabled={!!invoiceNumber}
                      onClick={() => removeItem(item.id)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="bill-item-bottom">
                    <div className="qty-control">
                      <button
                        type="button"
                        disabled={!!invoiceNumber}
                        onClick={() => decreaseQuantity(item.id)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        disabled={!!invoiceNumber}
                        onClick={() => increaseQuantity(item.id)}
                      >
                        +
                      </button>
                    </div>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bill-summary">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Taxable Amount</span>
              <strong>{money(taxableAmount)}</strong>
            </div>
            <div>
              <span>CGST 2.5%</span>
              <strong>{money(cgst)}</strong>
            </div>
            <div>
              <span>SGST 2.5%</span>
              <strong>{money(sgst)}</strong>
            </div>

            <div className="grand-total">
              <div>
                <strong>GRAND TOTAL</strong>
                <span>Inclusive of taxes</span>
              </div>
              <b>{money(total)}</b>
            </div>
          </div>

          {invoiceNumber ? (
            <button
              type="button"
              className="settle-button new-bill-action"
              onClick={startNewBill}
            >
              <span>🧾 Start New Bill</span>
            </button>
          ) : (
            <>
              {/* <div className="bill-actions">
                <button
                  type="button"
                  className="hold-action"
                  disabled={saving || !cart.length}
                  onClick={handleHold}
                >
                  ⏸ Hold Bill
                </button>
              </div> */}

              <button
                type="button"
                className="settle-button"
                disabled={saving || !cart.length}
                onClick={openPaymentModal}
              >
                <span>Pay & Settle</span>
                <strong>{money(total)}</strong>
                <kbd>F9</kbd>
              </button>

              {draftId && (
                <button
                  type="button"
                  className="cancel-link"
                  onClick={() => setShowCancel(true)}
                >
                  Cancel Bill
                </button>
              )}
            </>
          )}
        </aside>
      </main>

      {/* Payment modal */}
      {showPayment && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-head">
              <div>
                <h2>Pay & Settle</h2>
                <p>Complete current bill</p>
              </div>
              <button type="button" onClick={() => setShowPayment(false)}>
                ×
              </button>
            </div>

            <div className="modal-total">
              <span>TOTAL</span>
              <strong>{money(total)}</strong>
            </div>

            <div className="modal-payment-tabs">
              {[
                ["CASH", "💵", "Cash"],
                ["UPI", "📱", "UPI"],
                ["SPLIT", "⇄", "Split"],
              ].map(([value, icon, label]) => (
                <button
                  type="button"
                  key={value}
                  className={paymentMethod === value ? "active" : ""}
                  onClick={() => selectPayment(value)}
                >
                  {icon}
                  <strong>{label}</strong>
                </button>
              ))}
            </div>

            {paymentMethod === "CASH" && (
              <div className="payment-input">
                <label>Cash Amount</label>
                <div>
                  ₹
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "UPI" && (
              <div className="payment-input">
                <label>UPI Amount</label>
                <div>
                  ₹
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="0.01"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "SPLIT" && (
              <div className="split-inputs">
                <div>
                  <label>Cash</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label>UPI</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" onClick={() => setShowPayment(false)}>
                Back
              </button>
              <button type="button" disabled={saving} onClick={handleComplete}>
                {saving ? "Processing..." : "Confirm & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held bills modal */}
      {showHeldBills && (
        <div className="modal-overlay">
          <div className="held-modal">
            <div className="modal-head">
              <div>
                <h2>Held Bills</h2>
                <p>Resume pending bills</p>
              </div>
              <button type="button" onClick={() => setShowHeldBills(false)}>
                ×
              </button>
            </div>

            <div className="held-list">
              {heldBills.length === 0 ? (
                <div className="held-empty">
                  <div>⏸</div>
                  <strong>No held bills</strong>
                  <span>Held bills will appear here.</span>
                </div>
              ) : (
                heldBills.map((bill) => {
                  const items = bill?.items || bill?.orderItems || [];
                  const quantity = items.reduce(
                    (sum, item) => sum + Number(item?.quantity || 0),
                    0
                  );

                  return (
                    <div className="held-item" key={bill.id}>
                      <div>
                        <strong>{bill.holdNumber || "Held Bill"}</strong>
                        <span>
                          {bill.createdAt
                            ? new Date(bill.createdAt).toLocaleString()
                            : ""}
                        </span>
                      </div>

                      <div>
                        <span>{quantity} items</span>
                        <strong>
                          {money(bill.totalAmount || bill.subtotal || 0)}
                        </strong>
                      </div>

                      <div className="held-actions">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => resumeBill(bill)}
                        >
                          Resume
                        </button>
                        <button
                          type="button"
                          className="held-delete-btn"
                          disabled={saving}
                          onClick={() => deleteHeldBill(bill)}
                          aria-label="Delete held bill"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="modal-overlay">
          <div className="cancel-modal">
            <div className="warning-icon">!</div>
            <h2>Cancel Bill</h2>
            <p>Enter cancellation reason.</p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation reason..."
            />

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowCancel(false);
                  setCancelReason("");
                }}
              >
                Keep Bill
              </button>
              <button
                type="button"
                className="danger"
                disabled={saving}
                onClick={handleCancel}
              >
                {saving ? "Cancelling..." : "Cancel Bill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;