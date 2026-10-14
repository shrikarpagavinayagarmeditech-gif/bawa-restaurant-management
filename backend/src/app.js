import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";

import branchRoutes from "./routes/admin/branch.routes.js";
import categoryRoutes from "./routes/admin/category.routes.js";
import shiftRoutes from "./routes/admin/shift.routes.js";
import foodItemRoutes from "./routes/admin/foodItem.routes.js";
import branchFoodRateRoutes from "./routes/admin/branchFoodRate.routes.js";
import adminOrderRoutes from "./routes/admin/order.routes.js";
import branchMenuRoutes from "./routes/branch/branchMenu.routes.js";
import orderRoutes from "./routes/branch/order.routes.js";
import billingRoutes from "./routes/branch/billing.routes.js";
import adminExpenseRoutes from "./routes/admin/expense.routes.js";
import adminReportRoutes from "./routes/admin/report.routes.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================
   Static Files
========================= */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

/* =========================
   Body Parser
========================= */

app.use(express.json());

/* =========================
   Health Check
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Bawa Restaurant API is running",
  });
});

/* =========================
   Authentication
========================= */

app.use("/api/auth", authRoutes);

/* =========================
   Admin Routes
========================= */

app.use(
  "/api/admin/branches",
  branchRoutes
);

app.use(
  "/api/admin/categories",
  categoryRoutes
);

app.use(
  "/api/admin/shifts",
  shiftRoutes
);

app.use(
  "/api/admin/food-items",
  foodItemRoutes
);

app.use(
  "/api/admin/branch-food-rates",
  branchFoodRateRoutes
);

/* =========================
   Branch Routes
========================= */

app.use(
  "/api/branch/menu",
  branchMenuRoutes
);

app.use(
  "/api/branch/orders",
  orderRoutes
);

app.use(
  "/api/branch/billing",
  billingRoutes
);
app.use(
  "/api/admin/expenses",
  adminExpenseRoutes
);

app.use("/api/admin/orders", adminOrderRoutes);


app.use(
  "/api/admin/reports",
  adminReportRoutes
);

export default app;