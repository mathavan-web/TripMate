# 🚕 TripMate

> A MERN-based business management platform for taxi drivers, tour operators, jeep safari operators, vehicle owners, and small travel businesses.
**Status:** 🚧 Active Development

TripMate manages the travel-business workflow from customer enquiry to quotation, booking, trip execution, payments, expenses, and profit tracking.

## 📌 Project Status
PhaseModuleStatusPhase 1Foundation & Authentication✅ CompletedPhase 2Customer & Enquiry Management✅ CompletedPhase 3Package & Quotation Management✅ CompletedPhase 4Booking & Trip Management✅ CompletedPhase 5Expenses, Payments & Profit✅ CompletedPhase 6Invoices & Reviews🚧 UpcomingPhase 7Reports, Analytics & Final Polish🚧 Upcoming

## ✨ Implemented Features

### 🔐 Phase 1 — Foundation & Authentication

- User registration and login
- JWT authentication and protected routes
- Password hashing
- Role foundation: Driver, Vehicle Owner, Admin
- User and business profiles
- Settings
- Responsive application layout
- REST API and MongoDB integration
- Dashboard foundation
- API health check

### 👥 Phase 2 — Customer & Enquiry Management
**Customer Management**

- Create, view, search, edit, archive/delete customers
- Customer details and ownership protection
**Enquiry Management**

- Customer-linked enquiries
- Travel and return dates
- Pickup, drop and destination
- Passenger count and vehicle preference
- Travel type and special requirements
- Estimated amount
- Status management, search and filtering

### 📦 Phase 3 — Package & Quotation Management
**Package Management**

- Tour packages
- Local sightseeing
- Jeep safari
- Airport transfer
- Outstation
- One-way and round-trip packages
- Custom packages
- Pricing, destinations, inclusions and exclusions
- Activate/deactivate packages
**Quotation Management**

- Create quotations from enquiries
- Package/customer/enquiry integration
- Line items, subtotal, discount, tax and total
- Advance and balance
- Automatic quotation numbering
- Draft, Sent, Accepted, Rejected, Expired and Cancelled statuses
- Validity, terms and pricing snapshot
- Preview/PDF support

### 🚕 Phase 4 — Booking & Trip Management
**Booking Management**

- Accepted quotation → booking workflow
- Customer, enquiry, quotation and package relationships
- Travel details and passenger count
- Vehicle information
- Pricing snapshot
- Advance and balance handling
- Booking status management
- Search/filtering
- Ownership protection
**Trip Management**

- Create trips from confirmed bookings
- Booking → Trip relationship
- Driver and vehicle information
- Travel details
- Trip status management
- Duplicate-trip prevention
- Search/filtering
**Business Rule:** A trip can only be created from a confirmed booking.

### 💰 Phase 5 — Expenses, Payments & Profit
**Payment Management**

- Payment CRUD
- Booking/trip relationships
- Payment numbering
- Advance, partial and final payments
- Refund handling
- Cash, UPI, bank transfer, card and other methods
- Search/filtering
- Payment validation
- Overpayment prevention
**Expense Management**

- Expense CRUD
- Trip/booking relationships
- Expense numbering
- Categories including Fuel, Toll, Parking, Food, Driver Allowance, Accommodation, Maintenance, Permit and Other
- Search/filtering
- Amount/date/payment-method validation
**Financial Management**

- Total revenue
- Payments received
- Pending balance
- Total trip expenses
- Trip profit
- Trip financial summary
- Dashboard financial metrics

### 🚧 Phase 6 — Invoices & Reviews
Planned:

- Invoice management
- Invoice numbering and generation
- Invoice PDF support
- Customer reviews
- Trip reviews
- Feedback management

### 🚧 Phase 7 — Reports, Analytics & Final Polish
Planned:

- Revenue, expense and profit reports
- Booking and trip analytics
- Customer analytics
- Dashboard improvements
- Advanced filters
- Performance improvements
- Final UI/UX polish

## 🔄 Application Workflow

```
Customer
   ↓
Enquiry
   ↓
Package
   ↓
Quotation
   ↓
Accepted Quotation
   ↓
Booking
   ↓
Confirmed Booking
   ↓
Trip
   ↓
Payments + Expenses
   ↓
Revenue + Balance + Profit
   ↓
Invoices + Reviews
   ↓
Reports & Analytics
```

## 💡 Why TripMate?
TripMate aims to bring customer, travel, booking and financial workflows into one platform for small travel businesses that may otherwise rely on notebooks, spreadsheets or disconnected tools.

## 🛠️ Technology Stack
**Frontend**

- React
- JavaScript
- HTML5
- CSS3
- Vite
**Backend**

- Node.js
- Express.js
- REST API
**Database**

- MongoDB
- Mongoose
**Authentication**

- JWT
- Password hashing
**Development Tools**

- VS Code
- Git
- GitHub
- GitHub Copilot

## 🎨 Design System
PurposeColorPrimary Deep Blue`#1565C0`Secondary Teal`#00A896`Accent Orange`#FF9800`Background`#F5F7FA`Card`#FFFFFF`Text`#172B4D`Success`#2E7D32`Warning`#F9A825`Error`#D32F2F`

The same visual language is maintained across all phases.

## 🗂️ Project Structure

```
TripMate/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   └── assets/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── tests/
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### 1. Clone

```
git clone https://github.com/mathavan-web/TripMate.git
cd TripMate
```

### 2. Backend

```
cd server
npm install
```
Create `server/.env`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```
Start the backend:

```
npm run dev
```

### 3. Frontend
Open another terminal:

```
cd client
npm install
npm run dev
```
Then open the local URL provided by Vite.

## 🔐 Security
TripMate uses:

- JWT authentication
- Password hashing
- Protected API routes
- Server-side ownership validation
- Authenticated user identification
- Request validation
- Protected booking, trip, payment and expense data
Ownership is enforced by the backend rather than trusted from frontend input.

## 🧪 Development & Verification
Completed phases are verified through backend tests, API checks, frontend production builds, authentication/ownership checks and runtime workflow verification.

### Phase 5 verification

```
Backend tests: 9 passed / 0 failed
Frontend build: Successful
Existing + Phase 5 API routes: Successful
```
Financial verification:

```
Booking Revenue       ₹25,000
Payments Received     ₹15,000
Pending Balance       ₹10,000
Total Expenses         ₹3,800
Profit                ₹21,200
```

## 🗺️ Development Roadmap

### ✅ Phase 1 — Foundation & Authentication
Core architecture, authentication, profiles, security and dashboard foundation.

### ✅ Phase 2 — Customer & Enquiry Management
Customer records, enquiries, relationships, search and filtering.

### ✅ Phase 3 — Package & Quotation Management
Packages, pricing, quotations, quotation workflow and pricing snapshots.

### ✅ Phase 4 — Booking & Trip Management
Bookings, trip management, booking-to-trip workflow, driver/vehicle information and trip status.

### ✅ Phase 5 — Expenses, Payments & Profit
Payments, expenses, balances, revenue, trip expenses, profit calculation and financial dashboard metrics.

### 🚧 Phase 6 — Invoices & Reviews
Invoices, invoice generation/PDF support and customer reviews.

### 🚧 Phase 7 — Reports, Analytics & Final Polish
Reports, analytics, dashboard improvements, advanced filtering, performance and final UI/UX refinement.

## 📈 Current Development Status
**Completed:** Phases 1–5

**Next:** Phase 6 — Invoices & Reviews

**Upcoming:** Phase 7 — Reports, Analytics & Final Polish

TripMate remains under active development and is not yet considered a final production release.

## 🤝 Development Approach
Each phase is:

1. Planned
2. Designed
3. Implemented
4. Tested
5. Verified
6. Documented
7. Integrated with previous phases
The goal is to keep TripMate maintainable while gradually expanding it into a complete travel-business management platform.

## 📌 Future Vision

```
Customer Management
       ↓
Travel Operations
       ↓
Booking Management
       ↓
Trip Management
       ↓
Financial Management
       ↓
Invoices & Reviews
       ↓
Reports & Analytics
```

## 👨‍💻 Developer
**Madhavan**

BCA Student | Web Development & Data Analysis Enthusiast

TripMate is being developed as an ongoing learning and portfolio project using the MERN stack.

## 📄 License
This project is currently under active development. Licensing can be finalized before the first public production release.

---
⭐ Follow the development as TripMate progresses through its remaining phases.

**TripMate — Building better tools for small travel businesses. 🚕💻**
