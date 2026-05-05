# CampusCart

CampusCart is a student-focused B2C e-commerce prototype for CO3027.  
The project now uses a light full-stack setup:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: JSON file persistence
- Auth: bcrypt password hashing + JWT

## What is implemented

- Product catalog and product detail pages
- Cart and checkout
- Simulated payment flow
- Order lifecycle with status updates
- Delivery fields and dummy courier assignment
- Admin dashboard with analytics
- Product management CRUD
- Rule-based recommendation system
- Role-based access control

## Project Structure

```text
.
├─ backend/
│  ├─ data/db.json
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ server.js
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  └─ services/
│  └─ package.json
├─ src/
│  ├─ components/
│  ├─ context/
│  ├─ data/
│  ├─ lib/
│  └─ pages/
├─ package.json
└─ .env.example
```

## Environment

Create the following files if you want to override defaults:

- `./.env.example`
- `./backend/.env.example`

Frontend env example:

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

Backend env example:

```bash
PORT=3001
JWT_SECRET=change-this-secret
CORS_ORIGIN=http://localhost:5173
```

## Default Accounts

The backend seeds two accounts on first run:

- Admin: `admin@campuscart.local`
- Password: `CampusCartAdmin2026`

- Student: `student@hcmut.local`
- Password: `Student123!`

## Run Locally

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Start backend

```bash
npm run backend
```

Backend default URL:

```text
http://localhost:3001
```

### 4. Start frontend

Open a second terminal:

```bash
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Products

- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

### Orders

- `GET /api/orders`
- `POST /api/orders`
- `POST /api/orders/:id/pay`
- `PATCH /api/orders/:id/status`

### Admin

- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/marketing`
- `PUT /api/admin/marketing`
- `GET /api/admin/batches`

### Recommendations

- `GET /api/recommendations`

## Notes

- Product/order/user data is persisted in `backend/data/db.json`.
- The frontend stores only the JWT token locally for session persistence.
- Recommendation logic is rule-based, not machine learning.
- Payment is simulated, not connected to a real gateway.

## Build

Frontend:

```bash
npm run build
```

Backend:

```bash
cd backend
npm run dev
```
