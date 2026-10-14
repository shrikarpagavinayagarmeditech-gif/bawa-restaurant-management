# API
Base URL: `http://localhost:4000/api`

## Auth
- `POST /auth/login`
- `GET /auth/me`

## Admin
- `GET/POST/PUT/DELETE /branches`
- `GET/POST/PUT/DELETE /categories`
- `GET/POST/PUT/DELETE /shifts`
- `GET/POST/PUT/DELETE /food-items`
- `GET/POST/PUT/DELETE /expenses`
- `GET /reports/summary`
- `GET /reports/food-wise`
- `GET /reports/shift-wise`
- `GET /reports/day-wise`
- `GET /reports/gst-wise`
- `GET /reports/branch-wise`
- `GET /reports/branch-comparison`
- `GET /reports/expense`
- `GET /reports/outstanding`

## Branch
- `GET /menu`
- `POST /orders`
- `GET /orders/today`
- `GET /dashboard/today`
- `GET/POST /expenses`

All protected endpoints use `Authorization: Bearer <token>`.
