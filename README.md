# CampusCart - E-Commerce For Students

A student-focused B2C pre-order application built to fulfill the CO3027 Electronic Commerce Final Project.

## Tech Stack & Framework Selection
This application is built using **React** with the **Vite** build tool.
- **Why React?**: React allows a highly responsive Single Page Application (SPA), improving the user experience and checkout flow significantly compared to traditional reloading pages. React’s component-based layout helps modularize our codebase.
- **Why Vite?**: Fast hot-module replacement and instant server start capability.

## Project Installation & Local Run
To evaluate this project locally, please follow these steps:

1. **System Requirement**: Ensure you have Node.js installed (v16.0 or higher recommended).
2. **Install Dependencies**:
   Open a terminal in the root directory of this project and run:
   ```bash
   npm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
4. **Access the web app**: Open `http://localhost:5173` in your browser.
5. **Admin Access (For testing Product Management & Analytics)**:
   Login with Email: `admin@campuscart.local`
   Password: `CampusCartAdmin2026`

## Hosting Plan
- **Frontend Hosting**: Since this application operates as a Single-Page Application, it can be deployed statically. The initial staging plan is to deploy it on **Vercel** or **Firebase Hosting**. Both services provide seamless integration with GitHub for continuous deployment, scalable global CDN delivery to reduce latency, and automated SSL certificate provisioning.

## Security Considerations
For this project architecture, our security design includes:
1. **At-Rest Protection**: Passwords are never stored in plain text. A hashing utility mechanism (`simpleHash`) protects user credentials before entering our data layer. 
2. **In-Transit Protection**: Production deployment on Vercel/Firebase enforces HTTPS/TLS encryption to prevent packet sniffing, protecting student credentials and simulated transaction data.
3. **Role-Based Access Control (RBAC)**: Enforced deeply across the routing level, blocking regular student accounts from accessing analytical business dashboards or performing Product / Vendor CRUD operations.

## E-Commerce 4.0 (Advanced Features)
- **AI-Based Recommendations**: Matches catalog items against campus proximity and user loyalty history to generate real-time product discovery feeds.
- **Data Analytics Dashboard**: Deep financial metrics, break-even unit economic modeling, and batch-delivery geographic optimizations computed in real-time.

---
*Group: INDOMIE - HCMUT*
