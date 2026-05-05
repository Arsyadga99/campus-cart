# CampusCart Code vs Report Audit

Scope:
- Codebase only, with report text extracted from `CO3027_GroupINDOMIE_Assignment_Report.pdf`.
- Focus only on the requested features: Part 4 core implementation and Part 5 AI features.
- Judgement is based on visible implementation, not on theory.

Scoring used for the summary:
- `Match = 1.0`
- `Partial = 0.5`
- `Missing = 0`
- `Overclaim = 0`

## Feature-by-Feature Check

| Feature | Requirement | Claimed in report | Found in code | Status | Issue | Fix |
|---|---|---|---|---|---|---|
| Product management | Admin CRUD for products | Yes. Report has `11.3.4 Product Management` at line 734. | Yes. Backend exposes `GET/POST/PATCH/DELETE /api/products` in `backend/src/routes/productRoutes.js` and CRUD handlers in `backend/src/controllers/productController.js`. Frontend inventory editor is in `src/pages/Inventory.jsx`. | Match | None. | None needed. |
| Shopping cart | Cart exists and can be updated from product pages | Yes. Report has `11.1.4 Shopping Cart and Checkout Flow` at line 670. | Yes. Cart state is saved in `src/context/AuthContext.jsx` and updated from `src/pages/Home.jsx` and `src/pages/ProductDetail.jsx`. Cart UI is in `src/pages/Cart.jsx`. | Match | None. | None needed. |
| Checkout | Checkout flow to review items and place order | Yes. Report covers the cart/checkout flow in `11.1.4` and says the checkout process is single-step around line 676. | Yes. `src/pages/Cart.jsx` implements delivery mode, address, promo code, payment method, price summary, and `Confirm pre-order`. Order creation is handled by `backend/src/controllers/orderController.js`. | Match | None. | None needed. |
| Payment (real / simulated) | Payment method must exist and can be real or simulated | Yes. Report has `11.3.6 Payment and Delivery` at line 742 and says multiple payment options reduce barriers at lines 743-744. | Yes, simulated only. `src/pages/Cart.jsx` offers `cod`, `vietqr`, and `bank`, shows a VietQR image, and `src/pages/Orders.jsx` has `Simulate payment`. Backend `payOrder` in `backend/src/controllers/orderController.js` flips payment status to `paid`. | Match | Payment is simulated only; no external gateway integration is present. | If the demo needs a real gateway, integrate one and update the report wording. If simulated is acceptable, keep as-is. |
| Order management | Create, list, and update orders/status | Yes. Report has `11.3.3 Order Management` at line 725. | Yes. Backend order endpoints are in `backend/src/routes/orderRoutes.js` and `backend/src/controllers/orderController.js`. Frontend order history and admin status updates are in `src/pages/Orders.jsx` and `src/pages/Admin.jsx`. | Match | None. | None needed. |
| Delivery | Delivery options and delivery handling | Yes. Report has `11.3.6 Payment and Delivery` at line 742 and says delivery clustering improves efficiency at line 745. | Yes. `src/pages/Cart.jsx` supports `pickup` vs `delivery`, district/ward/street address capture, and courier display. `backend/src/services/batches.js` groups orders into delivery batches and assigns couriers. `backend/src/controllers/orderController.js` stores `delivery_status` and `courier_name`. | Match | None. | None needed. |
| Security | Auth, password hashing, middleware, and role checks | Yes. Report has `11.3.7 Security Considerations` at line 746 and mentions role-based routing at line 747. | Yes. `backend/src/controllers/authController.js` uses `bcryptjs` hashing and `jsonwebtoken` tokens. `backend/src/middleware/auth.js` verifies bearer tokens and enforces roles. Frontend token storage and auth flow are in `src/lib/http.js` and `src/context/AuthContext.jsx`. | Match | None. | None needed. |
| Recommendation system (collaborative filtering) | Collaborative filtering recommendation engine | Partial. Report has `11.4.1 AI-based Recommendation` at line 762 and describes recommendations in general at line 763, but it does not name collaborative filtering. | Yes. `backend/src/services/recommendationML.js` builds a purchase matrix, computes cosine similarity, and returns `method: 'collaborative-filtering'`. `backend/src/controllers/recommendationController.js` serves the ML recommendations at `/api/recommendations/ml` and the frontend renders them in `src/pages/Home.jsx`. | Partial | The report is too generic. It claims AI recommendation, but it does not explain the actual collaborative-filtering method used in code. | Add a short subsection that explicitly states the collaborative-filtering algorithm, purchase-overlap logic, and similarity measure. |
| Fallback logic | Return a non-ML backup when recommendation data is sparse | No explicit mention found in the report AI section. The report only claims AI-based recommendation at line 762. | Yes. `backend/src/services/recommendationML.js` returns an empty ML result when there is not enough signal, and `backend/src/controllers/recommendationController.js` falls back to `buildRecommendationFeed(...)` with `source: 'rule-based-fallback'`. | Partial | The code has a fallback path, but the report does not document when it triggers or what it returns. | Add a fallback subsection with the trigger condition and the rule-based backup behavior. |
| AI metrics | Precision, recall, and F1 are computed and shown | No explicit mention found in the report AI section. | Yes. `backend/src/controllers/aiMetricsController.js` computes `precision`, `recall`, and `f1_score`. `src/pages/Admin.jsx` fetches `/api/admin/ai-performance` and displays the three metrics plus counts and trend bars. | Partial | The report does not document the metrics endpoint, the formulas, or where the values are shown in the UI. | Add a metrics subsection that references the admin dashboard and the `/api/admin/ai-performance` endpoint. |

## Summary

- Overall alignment score: **85%**
- Calculation: `7 Match x 1.0 + 3 Partial x 0.5 = 8.5 / 10 = 85%`

## Strong Parts

- Product management is fully implemented in backend and frontend.
- Cart, checkout, order creation, and order history are present and connected to the backend.
- Delivery handling is not only present, but also tied to batch grouping and courier assignment.
- Security is real, not just described: password hashing, JWT auth, bearer-token middleware, and role enforcement are all in code.

## Weak Parts

- The AI section in the report is too high level. It does not explicitly describe the collaborative-filtering method used by the code.
- The fallback recommendation path exists in code, but the report does not explain it.
- The AI metrics endpoint exists in code, but the report does not mention precision, recall, or F1.

## Final Verdict

There is no major overclaim in the checked scope. The main problem is **documentation gap in Part 5**: the code is stronger and more specific than the report text. For demo and grading, the risk is not missing functionality, but missing explanation of the AI implementation details.
