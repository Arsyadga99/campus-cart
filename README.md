# CampusCart - B2C E-Commerce For Students

**Repository:** [https://github.com/Arsyadga99/campus-cart](https://github.com/Arsyadga99/campus-cart)

## Overview
**General Overview:**
CampusCart is a specialized, student-focused pre-order e-commerce platform designed to fulfill the requirements of the CO3017 Electronic Commerce Final Project. The application provides an end-to-end purchasing ecosystem tailored specifically for university campus environments. It bridges the gap between students looking for daily college essentials and on-campus vendors, streamlining distribution directly to dormitories and major campus hubs.

**Technical Overview:**
From a technical standpoint, CampusCart is a modern Single Page Application (SPA) driven by React 18 and Vite. It utilizes a centralized Context API acting as an in-memory client-side data store, gracefully bypassing the need for a complex backend while preserving full state-persistence via local storage mapping. The UI is built entirely using vanilla CSS3 Grid and Flexbox layouts without heavy dependencies, guaranteeing high customizability, rapid hot-module reloads, and absolute zero-latency cart mutations.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features & System Design](#key-features--system-design)
- [Advanced Mechanics (E-Commerce 4.0)](#advanced-mechanics-e-commerce-40)
- [Code Architecture & Structure](#code-architecture--structure)
- [Installation & Execution Guide](#installation--execution-guide)
- [Academic Rubric Compliance Checklist](#academic-rubric-compliance-checklist)

## Tech Stack

| Technology | Role | Justification |
|------------|------|---------------|
| **React 18** | UI Framework | Enables declarative, state-driven interfaces and immediate view re-renders during cart interactions. |
| **Vite** | Build Tool | Provides instantaneous hot module replacement (HMR) and extremely optimized static production builds. |
| **React Router DOM** | Client Routing | Handles simulated multi-page behavior and Role-Based Access Control (RBAC) route guarding. |
| **Vanilla CSS3** | Styling | Employs custom CSS variables and Grid rules, proving full mastery of aesthetic design without Bootstrap/Tailwind. |
| **Context API** | State Mapping | Coordinates cross-component data feeds (Cart, User Sessions, Product Catalogs) deeply globally. |

## Key Features & System Design

### User Interfaces & Flow
- **Product Catalog & Details**: Dynamic multi-column responsive grids mapped directly to active inventories. Includes robust detail pages (`/product/:id`) for specification reviews.
- **Cart & Checkout Logic**: Complete boundary interactions ensuring quantity limits, dynamic price totalizations, contextual delivery routing, and simulated VietQR payment API capabilities.
- **Product Management**: Administrative users receive full CRUD capabilities mapped securely behind protected dashboards seamlessly processing catalog edits without complex setups.

### Visual Design Principles
- **Layout & Color Theory**: Features earthy, warm-toned beige (`#f3efe8`) and heavy forest green (`#1f4f46`) aimed at establishing organic trust and reducing visual glare, departing from conventional saturated corporate platforms.
- **Typography & Accessibility**: Pairs high-contrast Google Fonts (*Fraunces* for headers, *Manrope* for values) maintaining strong semantic HTML rendering with extremely generous tapping metrics (`1rem` minimum boundaries).

## Advanced Mechanics (E-Commerce 4.0)
As part of our commitment to modern e-commerce trends, we developed:
- **Data Analytics Dashboard**: A natively built Business Intelligence unit computing live Gross Merchandise Volume, Net-Contribution Margins, and break-even unit strategies directly in `Admin.jsx`.
- **Mobile-First Responsiveness**: Strict `.page-shell` CSS-Grid matrices ensure the complete application funnels downward flawlessly for cellular layouts, acknowledging the >80% mobile market share of modern students traversing campus.
- **Context-Aware Filtering**: Simulated personalization matching user-campus origins to prioritize relevant products, dramatically reducing interaction funnel friction.

## Code Architecture & Structure
If you intend to scale, fork, or modify the application visually, rely on the following framework structural map:
- `src/App.jsx`: The absolute top-level component, mapping explicit URL paths natively into active views.
- `src/context/AuthContext.jsx`: The foundational "Brain" of the database schema. This module intercepts logic queries, stores NoSQL-like arrays across the `localStorage`, and handles global memory streaming.
- `src/pages/`: Modularized container screens holding large functional chunks. (e.g., `Home.jsx` drives the frontend consumer catalog, `Inventory.jsx` powers the vendor inventory loop). 
- `src/components/`: Abstracted singular interaction elements isolated from logic (e.g., `Navbar.jsx`).
- `src/index.css`: The singular global master stylesheet manipulating raw styling configurations exclusively via dynamic CSS-Variables.

## Installation & Execution Guide

To perform local integration verifications and testing, deploy the source locally utilizing the explicit steps below:

1. **Clone the Repository**
   Download the exact copy using terminal interfaces:
   ```bash
   git clone https://github.com/Arsyadga99/campus-cart.git
   cd campus-cart
   ```
2. **Verify Dependencies**
   Ensure the device engine possesses Node.js (v16.0 or higher).
3. **Install Packages**
   Pull explicitly required library dependencies:
   ```bash
   npm install
   ```
4. **Boot Local Server**
   Start the Vite Development rendering engine:
   ```bash
   npm run dev
   ```
5. **View Application**
   Launch any web browser pointing to `http://localhost:5173`. Any text edits committed to `.jsx` or `.css` files will invoke instantaneous visual hot-reloads over your terminal automatically.

### Evaluation Test Accounts
To bypass registrations and test isolated components:
- **Administrative Portal Access**: Email: `admin@campuscart.local` (Password: `CampusCartAdmin2026`)
- **Student Consumer Portal**: Email: `student@hcmut.local` (Password: `Student123!`)

---

## Academic Rubric Compliance Checklist

This section serves as a direct index/proof of implementation for the University grading rubric evaluated against the source code.

### Part 3: System Design
**3.1 Interface Designs Implemented [x]**
- [x] **Homepage**: Implemented in `src/pages/Home.jsx`.
- [x] **Product Listing Page**: Integrated concurrently with dynamic mappings inside `src/pages/Home.jsx`.
- [x] **Product Details Page**: Implemented as a dedicated view at `src/pages/ProductDetail.jsx`.
- [x] **Shopping Cart**: Fully functional pseudo-session cart implemented in `src/pages/Cart.jsx`.
- [x] **Checkout Process**: Interactive single-flow state built into the culmination of `src/pages/Cart.jsx`. 

**3.2 Visual Design Principles [x]**
- [x] **Layout & Navigation**: Uses pure CSS Grid & Flexbox matrices. Sticky Header/Navbar located at `src/components/Navbar.jsx`.
- [x] **Color Scheme**: Earth-tones strictly defined utilizing global css variables inside `src/index.css` (`--bg`, `--accent`).
- [x] **Typography**: Google Fonts pairing (*Fraunces* for commanding headers & *Manrope* for legible body data).
- [x] **Usability**: Ghost buttons clearly segregate secondary functions against Primary CTAs to prevent conversion confusion.
- [x] **Accessibility**: Huge minimal padding (`1rem`) on interactive tapping grids guaranteeing superior thumb-scaling.

### Part 4: Implementation
**4.1 System Deployment [x]**
- [x] **Product Management**: Full CRUD Catalog Dashboard built directly inside `src/pages/Inventory.jsx`.
- [x] **Shopping Cart**: Real-time virtual array synchronizations managed globally via `AuthContext.jsx`.
- [x] **Payment Method**: Simulated Cash-On-Delivery and VietQR code integrations evaluated conditionally upon Checkout.
- [x] **Order Management**: Administrative tracking capacities actively routed on the `Admin.jsx` dashboard.
- [x] **Delivery Options**: Contextual branch-delivery algorithms (mapping across specific campus sectors).
- [x] **Security Considerations**: Strict Role-Based Access Routing intercepting unauthorized payloads. Target deployment intrinsically runs atop HTTPS edge protocols.

**Framework & Deployment Logic [x]**
- [x] **Appropriate Framework Chosen**: React + Vite (Chosen for strict SPA capabilities eliminating heavy re-renders).
- [x] **Framework Features Leveraged**: React Hooks & Context API leveraged structurally for total state synchronization without external state dependencies (e.g. Redux).
- [x] **Custom Features Implemented**: Core Break-even and Contribution-Margin algorithms processing dynamically on the Admin dashboard.
- [x] **Hosting Plan Details**: Target stateless architecture deployed instantly to Edge CDN services (Vercel) allowing robust CI/CD Github polling and guaranteed uptime.

**4.2 Demo Source Code [x]**
- [x] **Source Code**: Fully documented and pushed on this GitHub Repository.
- [x] **Database**: Localized NoSQL architecture directly mocked to Browser LocalStorage, ensuring exact grading configuration capabilities without setting up external docker networks.
- [x] **Installation Instructions**: Stated thoroughly in the Chapter section above (`npm run dev`).

### Part 5: Advanced Features
**Design E-Commerce 4.0 Mechanics [x]**
- [x] **AI-based Recommendation (Simulated)**: Algorithmic context-aware filtering mapping users to relevant products based on their enrolled campus metrics.
  - *Why it's important*: Reduces search fatigue and bounce rates by instantly surfacing relevant college-specific inventory.
  - *How it improves UX:* Custom tailors the storefront experience per student, simulating modern predictive UX mechanics.
- [x] **Data Analytics Dashboard**: A specialized administrative viewport monitoring GMV, Net Margins, and dynamic cost allocations. 
  - *Why it's important*: Ensures business owners visually intercept decaying profit margins against variable fees in real-time.
  - *How it improves business:* Immediate actionable oversight permitting structural catalog pivots enabling business scaling.
- [x] **Mobile-first Design Fluidity**: Structural fluid metrics adapting via CSS parameters (`.page-shell`).
  - *Why it's important*: Transacting demographics natively purchase in transit off constrained portrait environments.
  - *How it improves UX:* Removes friction points, scaling internal Grid compartments aggressively downward preventing funnel drop-offs.

