# 🚕 TripMate

> **A simple business management platform for local taxi drivers, jeep safari operators, and small tour businesses.**

TripMate is a full-stack **MERN** web application designed to help small travel and transportation businesses manage their complete customer and trip workflow from one place.

Instead of using separate notebooks, spreadsheets, messaging apps, and payment records, TripMate brings the essential operations into a single system.

---

## 📌 Project Overview

Small local tour and taxi operators often manage their business manually. Customer enquiries, quotations, bookings, trips, expenses, payments, invoices, and reviews can become difficult to track as the number of customers increases.

TripMate provides a centralized solution for managing this workflow:

```text
Customer Enquiry
       ↓
Package
       ↓
Quotation
       ↓
Booking
       ↓
Trip
       ↓
Payments & Expenses
       ↓
Trip Completion
       ↓
Invoice
       ↓
Customer Review
```

The application is intentionally designed to remain **simple and practical** for local business owners rather than introducing unnecessary enterprise-level complexity.

---

# ✨ Features

## 🔐 Authentication & Business Profile

* User registration and login
* JWT-based authentication
* Protected routes
* Business profile management
* Business-specific data access

---

## 👥 Customer Management

* Create customers
* Update customer information
* View customer details
* Customer history
* Search and manage customer records

---

## 📩 Enquiry Management

Manage incoming customer enquiries and track them through the sales process.

* Create enquiries
* Update enquiry details
* Track enquiry status
* Connect enquiries with customers and packages

---

## 📦 Package Management

Create and manage travel packages.

* Package details
* Pricing
* Duration
* Destinations
* Package availability
* Package information connected to quotations and bookings

---

## 📄 Quotation Management

Create quotations for customer enquiries.

* Generate quotations
* Add package and trip information
* Track quotation status
* Accept or reject quotations
* Convert accepted quotations into bookings

---

## 🚕 Booking Management

Manage confirmed customer bookings.

* Create bookings
* Booking status management
* Customer and package information
* Travel dates
* Passenger information
* Booking amount
* Booking history

Trip creation is restricted to appropriate confirmed bookings to maintain workflow integrity.

---

## 🗺️ Trip Management

Manage the actual travel operation.

Trip statuses include:

```text
Scheduled
Started
Completed
Cancelled
```

Trip management includes:

* Trip scheduling
* Customer information
* Destination
* Vehicle details
* Passenger information
* Trip status
* Trip completion

---

## 💰 Payments & Expenses

Track the financial side of each booking and trip.

### Payments

* Record customer payments
* Track paid amount
* Track pending balance
* Link payments with bookings/trips

### Expenses

* Record trip expenses
* Categorize expenses
* Track expense amounts
* Associate expenses with trips

### Profit Calculation

TripMate calculates business performance using:

```text
Profit = Revenue - Expenses
```

The financial calculations also account for applicable payment/refund logic.

---

# 🧾 Invoice Management

TripMate supports invoice generation as part of the completed-trip workflow.

Features include:

* Automatic invoice generation
* Unique invoice numbering
* Invoice date
* Customer details
* Business details
* Trip information
* Booking information
* Payment information
* Balance information
* Invoice PDF generation
* Public invoice access

The invoice data is designed to preserve the relevant billing information at the time of invoice generation.

---

# 📱 WhatsApp Invoice Sharing

TripMate provides a simple WhatsApp sharing workflow for invoices.

The system can generate a WhatsApp message containing the public invoice link so the business owner can share it with the customer.

This uses the user's WhatsApp workflow rather than pretending to provide an official WhatsApp Business API integration.

---

# ⭐ Customer Reviews

Customers can provide feedback after a completed trip.

Review functionality includes:

* Rating from 1–5
* Customer comment
* Trip association
* Prevention of duplicate reviews for the same trip

---

# 📅 Trip Calendar

TripMate includes a simple calendar designed around the driver's daily workflow.

The calendar:

* Shows dates containing trips
* Supports month navigation
* Allows selecting a date
* Displays trips scheduled for that date
* Supports multiple trips on the same date
* Provides quick access to trip details

The calendar uses the **actual trip date**, making it useful for daily scheduling.

---

# 📊 Simple Business Summary

TripMate avoids complicated business intelligence dashboards.

Instead, it provides the information a small business owner actually needs:

* Revenue
* Expenses
* Profit
* Pending payments

The summary supports useful periods such as:

* This Month
* Last Month
* This Year
* Custom Date Range

All values are calculated from actual application data.

---

# 📋 Simple Reports

TripMate provides compact reports focused on practical business information.

### Trip Report

Includes information such as:

* Customer
* Trip date
* Destination
* Status
* Amount

### Payment Report

Includes:

* Customer
* Booking
* Payment amount
* Payment status
* Date

### Expense Report

Includes:

* Trip
* Expense category
* Amount
* Date

The reporting functionality is intentionally kept simple for the application's target users.

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* JavaScript
* CSS

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JSON Web Tokens (JWT)

## Other Technologies

* REST APIs
* PDF generation
* WhatsApp sharing
* Git & GitHub

---

# 🏗️ Project Architecture

```text
TripMate/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── tests/
│   └── package.json
│
├── README.md
└── ...
```

The exact structure may evolve as the project develops.

---

# 🔄 Complete Business Workflow

TripMate follows a structured business lifecycle:

```text
                 ┌──────────────┐
                 │   Customer   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   Enquiry    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   Package    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  Quotation   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   Booking    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │     Trip     │
                 └──────┬───────┘
                        ↓
             ┌──────────┴──────────┐
             ↓                     ↓
        ┌──────────┐          ┌──────────┐
        │ Payments │          │ Expenses │
        └────┬─────┘          └────┬─────┘
             └──────────┬──────────┘
                        ↓
                 ┌──────────────┐
                 │   Complete   │
                 │     Trip     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   Invoice    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Review    │
                 └──────────────┘
```

---

# ⚙️ Installation

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB or MongoDB Atlas
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/mathavan-web/TripMate.git

cd TripMate
```

---

## 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3. Configure Backend Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit the `.env` file to GitHub.

---

## 4. Start the Backend

```bash
npm start
```

The backend will run on the configured port.

---

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

---

## 6. Start the Frontend

```bash
npm run dev
```

Vite will provide the local development URL.

---

# 🔑 Environment Variables

Typical backend environment variables include:

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `PORT`        | Backend server port                |
| `MONGODB_URI` | MongoDB connection string          |
| `JWT_SECRET`  | Secret used for JWT authentication |

Additional deployment variables may be required depending on the hosting environment.

Never expose secret environment variables in frontend code.

---

# 🧪 Testing

The backend includes automated regression tests.

Run:

```bash
cd server
node --test tests/*.test.js
```

The final Phase 7 regression verification achieved:

```text
23 tests passed
0 tests failed
```

---

# 🏭 Production Build

To create a production build of the frontend:

```bash
cd client
npm run build
```

The Phase 7 production build completed successfully.

---

# 🚀 Deployment

TripMate is structured to support deployment using services such as:

* MongoDB Atlas for the database
* Render or similar platforms for backend hosting
* Static hosting for the React frontend

Before deployment, configure the required environment variables on the hosting platform.

Do not upload local `.env` files containing credentials.

---

# 🔒 Security Considerations

TripMate uses:

* JWT authentication
* Protected API routes
* Business/user ownership checks
* Environment variables for secrets
* Backend validation
* Database-level relationships

Customer and business information should only be accessible to authorized users.

---

# 📱 Design Philosophy

TripMate is intentionally designed around **simplicity**.

The target users are:

* Local taxi drivers
* Jeep safari operators
* Small tour operators
* Vehicle owners
* Small travel businesses

Therefore, the application avoids unnecessary:

* Complex analytics
* Enterprise dashboards
* Predictive systems
* Complicated KPI systems
* Large business intelligence features

The goal is to make important information available quickly:

> **Customers → Bookings → Trips → Money → Invoices**

---

# 🗺️ Development Phases

TripMate was developed incrementally through seven phases.

| Phase   | Description                                  | Status      |
| ------- | -------------------------------------------- | ----------- |
| Phase 1 | Foundation & Authentication                  | ✅ Completed |
| Phase 2 | Customer & Enquiry Management                | ✅ Completed |
| Phase 3 | Package & Quotation Management               | ✅ Completed |
| Phase 4 | Booking & Trip Management                    | ✅ Completed |
| Phase 5 | Expenses, Payments & Profit                  | ✅ Completed |
| Phase 6 | Invoices & Reviews                           | ✅ Completed |
| Phase 7 | Trip Calendar, Simple Reports & Final Polish | ✅ Completed |

---

# 🎯 Current Status

**TripMate has completed all seven planned development phases.**

The application currently provides a complete workflow for managing:

```text
Customers
    ↓
Enquiries
    ↓
Packages
    ↓
Quotations
    ↓
Bookings
    ↓
Trips
    ↓
Payments
    ↓
Expenses
    ↓
Invoices
    ↓
Reviews
    ↓
Calendar & Simple Reports
```

The project has also undergone backend regression testing and a production frontend build verification.

---

# 🔮 Future Possibilities

Future development may include features such as:

* Dedicated platform administration
* Customer-facing services
* Multi-business platform capabilities
* Additional integrations
* Advanced reporting if required by real users

These features are intentionally outside the current TripMate scope.

---

# 👨‍💻 Developer

**Mathavan**

BCA Student
Full-Stack Development & Data Analytics Enthusiast

GitHub:
https://github.com/mathavan-web

---

# 📄 License

This project is developed as a personal/academic project.

Add an appropriate open-source license here if you decide to make the project officially open source.
