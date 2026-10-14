import api from "../api/api.js";


// =====================================================
// DASHBOARD SUMMARY
// =====================================================

export const getReportDashboard = async () => {
  const response = await api.get(
    "/admin/reports/dashboard-summary"
  );

  return response.data;
};


// =====================================================
// FOOD-WISE REPORT
// =====================================================

export const getFoodWiseReport = async (params = {}) => {
  const response = await api.get(
    "/admin/reports/food-wise",
    {
      params,
    }
  );

  return response.data;
};


// =====================================================
// SHIFT-WISE REPORT
// =====================================================

export const getShiftWiseReport = async (params = {}) => {
  const response = await api.get(
    "/admin/reports/shift-wise",
    {
      params,
    }
  );

  return response.data;
};


// =====================================================
// DAY-WISE REPORT
// =====================================================

export const getDayWiseReport = async (params = {}) => {
  const response = await api.get(
    "/admin/reports/day-wise",
    {
      params,
    }
  );

  return response.data;
};


// =====================================================
// CUSTOM DATE REPORT
// =====================================================

export const getCustomDateReport = async (params = {}) => {
  const response = await api.get(
    "/admin/reports/custom-date",
    {
      params,
    }
  );

  return response.data;
};

export const getGstWiseReport = async (params = {}) => {
  const response = await api.get("/admin/reports/gst-wise", {
    params,
  });

  return response.data;
};


export const getBranchWiseReport = async (params = {}) => {
  const response = await api.get("/admin/reports/branch-wise", {
    params,
  });

  return response.data;
};



export const getBranchComparisonReport = async (params = {}) => {
  const response = await api.get(
    "/admin/reports/branch-comparison",
    { params }
  );

  return response.data;
};

