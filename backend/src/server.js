// import dotenv from "dotenv";
// import app from "./app.js";

// dotenv.config();

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`API running on http://localhost:${PORT}`);
// });


import "dotenv/config";
import app from "./app.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bawa Restaurant API running on port ${PORT}`);
});
