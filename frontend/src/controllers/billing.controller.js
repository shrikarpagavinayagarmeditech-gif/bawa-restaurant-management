import api from "../api/api.js";

/* =========================================================
   GET TODAY SUMMARY
========================================================= */

export const getTodayBillingSummary = async () => {
  const response = await api.get(
    "/branch/billing/today-summary"
  );

  return response.data;
};


/* =========================================================
   HOLD BILL
========================================================= */

export const holdBilling = async ({
  items,
  discountAmount = 0,
}) => {
  const response = await api.post(
    "/branch/billing/hold",
    {
      items,
      discountAmount,
    }
  );

  return response.data;
};


/* =========================================================
   GET HELD BILLS
========================================================= */

export const getHeldBilling = async () => {
  const response = await api.get(
    "/branch/billing/holds"
  );

  return response.data;
};


/* =========================================================
   GET DRAFT BILL
========================================================= */

export const getDraftBilling = async (id) => {
  const response = await api.get(
    `/branch/billing/draft/${id}`
  );

  return response.data;
};


/* =========================================================
   UPDATE DRAFT BILL
========================================================= */

export const updateDraftBilling = async ({
  id,
  items,
  discountAmount = 0,
}) => {
  const response = await api.put(
    `/branch/billing/draft/${id}`,
    {
      items,
      discountAmount,
    }
  );

  return response.data;
};


/* =========================================================
   COMPLETE BILL
========================================================= */

export const completeBilling = async ({
  id,
  paymentMethod,
  cashAmount = 0,
  upiAmount = 0,
}) => {
  const response = await api.post(
    `/branch/billing/complete/${id}`,
    {
      paymentMethod,
      cashAmount,
      upiAmount,
    }
  );

  return response.data;
};


/* =========================================================
   CANCEL BILL
========================================================= */

export const cancelBilling = async ({
  id,
  cancellationReason,
}) => {
  const response = await api.post(
    `/branch/billing/cancel/${id}`,
    {
      cancellationReason,
    }
  );

  return response.data;
};