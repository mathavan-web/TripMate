# 🚕 TripMate

> **A simple business management platform for local taxi drivers, jeep safari operators, and small tour businesses.**

TripMate is a full-stack **MERN web application** designed to help small travel and transportation businesses manage their daily operations from one place.

It brings together customer management, enquiries, packages, quotations, bookings, trips, payments, expenses, invoices, reviews, scheduling, and simple business summaries into a single workflow.

The application is designed with a **simplicity-first approach**, focusing on practical features that small business owners can actually use rather than adding unnecessary enterprise-level complexity.

---

## 🎯 Problem

Local taxi drivers, jeep safari operators, and small tour operators often manage their business using a combination of:

* Notebooks
* Phone contacts
* WhatsApp conversations
* Spreadsheets
* Manual payment records
* Separate invoice tools

This can make it difficult to keep track of customers, bookings, trips, payments, expenses, and pending balances.

### TripMate aims to solve this by providing:

> **One simple system to manage the complete customer-to-trip business workflow.**

---

# ✨ Key Features

### 🔐 Authentication & Business Profile

* User registration and login
* JWT-based authentication
* Protected routes
* Business profile management
* Business-specific data access

### 👥 Customer Management

* Create and manage customers
* Update customer information
* View customer history
* Search customer records
* Connect customers with enquiries and bookings

### 📩 Enquiry Management

* Create customer enquiries
* Manage enquiry details
* Track enquiry status
* Connect enquiries with customers and packages

### 📦 Package Management

* Create travel packages
* Manage package details
* Set pricing
* Define destinations and duration
* Use packages in quotations and bookings

### 📄 Quotation Management

* Create quotations
* Connect quotations with customers and packages
* Track quotation status
* Accept or reject quotations
* Convert accepted quotations into bookings

### 📋 Booking Management

* Manage customer bookings
* Track booking status
* Store travel information
* Manage passenger details
* Track booking amounts
* Connect confirmed bookings with trips

### 🚕 Trip Management

Manage the actual travel operation using:

```text
Scheduled
Started
Completed
Cancelled
```

Trip management includes:

* Travel dates
* Customer information
* Destination
* Vehicle details
* Passenger count
* Trip status
* Booking relationship

### 💰 Payments & Expenses

Track the financial side of each trip.

**Payments**

* Record payments
* Track paid amounts
* Track pending balances
* Connect payments with bookings/trips

**Expenses**

* Record trip expenses
* Categorize expenses
* Track expense amounts
* Associate expenses with trips

### 📈 Profit Calculation

TripMate provides a simple profit calculation based on actual business data:

```text
Profit = Revenue - Expenses
```

Existing payment/refund logic is incorporated into the application's financial calculations.

---

# 🧾 Invoice Management

TripMate includes an invoice workflow connected to completed trips.

Features include:

* Automatic invoice generation
* Unique invoice numbering
* Invoice date
* Business information
* Customer information
* Booking information
* Trip information
* Payment information
* Balance information
* PDF invoice generation
* Public invoice access

The invoice information is designed to preserve the relevant billing details at the time of invoice creation.

---

# 📱 WhatsApp Invoice Sharing

TripMate provides a simple way to share an invoice through WhatsApp.

The system generates a WhatsApp sharing link containing the public invoice URL so the business owner can send it directly to the customer.

This uses the user's WhatsApp workflow and does not require TripMate to act as an official WhatsApp Business API provider.

---

# ⭐ Customer Reviews

Customers can provide feedback after completing a trip.

Review functionality includes:

* Rating from 1–5
* Customer comments
* Trip association
* Prevention of duplicate reviews for the same trip

---

# 📅 Trip Calendar

TripMate includes a practical calendar designed around the daily workflow of small travel businesses.

The calendar allows users to:

* View trips by date
* Navigate between months
* Identify dates containing trips
* Select a date to view scheduled trips
* Handle multiple trips on the same date
* Navigate to existing trip details

The calendar focuses on the **actual trip date**, making it useful for scheduling and daily planning.

---

# 📊 Simple Business Summary

TripMate intentionally avoids complicated analytics dashboards.

Instead, it provides practical information such as:

* Revenue
* Expenses
* Profit
* Pending payments

Users can view summaries for useful periods such as:

* This Month
* Last Month
* This Year
* Custom Date Range

All values are calculated using actual application data.

---

# 📋 Simple Reports

TripMate provides compact reports for commonly required business information.

### Trip Report

Includes:

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

The reports are intentionally kept simple and focused on the needs of small business operators.

---

# 🧭 Navigation

TripMate uses a simple categorized navigation system to keep the interface clean.

```text
☰ Navigation

├── 🏠 Dashboard
├── 📅 Calendar
│
├── 📋 Sales
│   ├── Customers
│   ├── Enquiries
│   ├── Packages
│   ├── Quotations
│   └── Bookings
│
├── 🚕 Operations
│   └── Trips
│
├── 💰 Finance
│   ├── Payments
│   ├── Expenses
│   └── Invoices
│
├── ⭐ Reviews
└── 📊 Reports
```

Navigation categories can be expanded and collapsed so the main interface remains uncluttered.

---

# 🔄 Complete Business Workflow

TripMate follows a structured business lifecycle:

```text
Customer
   ↓
Enquiry
   ↓
Package
   ↓
Quotation
   ↓
Booking
   ↓
Trip
   ↓
Payments + Expenses
   ↓
Trip Completed
   ↓
Invoice
   ↓
Review
```

The calendar and business summary provide additional visibility into the operational and financial side of the business.

---

# 🛠️ Technology Stack

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

## Development & Tools

* Git
* GitHub
* VS Code
* REST APIs
* PDF generation
* WhatsApp sharing

---

# 🏗️ Project Structure

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
│   ├── public/
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

The exact structure may change as the project evolves.

---

# ⚙️ Installation

## Prerequisites

Install the following:

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

## 3. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Never commit the `.env` file to GitHub.

---

## 4. Start the Backend

```bash
npm start
```

The backend will start on the configured port.

---

## 5. Install Frontend Dependencies

Open a new terminal:

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

The backend requires environment variables similar to:

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `PORT`        | Backend server port                |
| `MONGODB_URI` | MongoDB connection string          |
| `JWT_SECRET`  | Secret used for JWT authentication |

Additional environment variables may be required depending on the deployment configuration.

**Never expose secret credentials in frontend code or commit them to GitHub.**

---

# 🧪 Testing

TripMate includes backend regression tests.

Run:

```bash
cd server
node --test tests/*.test.js
```

The final Phase 7 verification achieved:

```text
23 tests passed
0 tests failed
```

---

# 🏭 Production Build

Build the frontend using:

```bash
cd client
npm run build
```

The final Phase 7 frontend production build completed successfully.

---

# 🚀 Deployment

TripMate is designed to support deployment using services such as:

* **MongoDB Atlas** — database
* **Render or similar platforms** — backend hosting
* **Static hosting platforms** — frontend hosting

Before deployment, configure the required environment variables on the hosting platform.

After deployment, verify:

* Frontend → Backend communication
* API URLs
* CORS
* MongoDB connection
* Authentication
* Invoice URLs
* Public invoice access
* WhatsApp sharing
* Production builds

---

# 🔒 Security

TripMate uses several mechanisms to protect application data:

* JWT authentication
* Protected routes
* Backend authorization
* Business/user ownership checks
* Server-side validation
* Environment variables for secrets
* Controlled public invoice access

Business data should only be accessible to authorized users.

---

# 📱 Responsive Design

TripMate is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile

The navigation and core workflows are designed to remain usable on smaller screens, which is particularly important for users who may manage their business primarily from a smartphone.

---

# 🎨 Design Philosophy

TripMate follows a **simplicity-first approach**.

The application is designed for:

* Local taxi drivers
* Jeep safari operators
* Small tour operators
* Vehicle owners
* Small travel businesses

Therefore, TripMate intentionally avoids unnecessary:

* Enterprise dashboards
* Complex business intelligence
* Predictive analytics
* Advanced forecasting
* Complicated KPI systems

Instead, the application focuses on:

> **Customers → Bookings → Trips → Money → Invoices**

---

# 🗺️ Development Journey

TripMate was developed through seven structured phases.

| Phase | Description                                  | Status      |
| ----- | -------------------------------------------- | ----------- |
| 1     | Foundation & Authentication                  | ✅ Completed |
| 2     | Customer & Enquiry Management                | ✅ Completed |
| 3     | Package & Quotation Management               | ✅ Completed |
| 4     | Booking & Trip Management                    | ✅ Completed |
| 5     | Expenses, Payments & Profit                  | ✅ Completed |
| 6     | Invoices & Reviews                           | ✅ Completed |
| 7     | Trip Calendar, Simple Reports & Final Polish | ✅ Completed |

---

# 📊 Project Status

## Development Status

**Feature-complete — 7/7 planned phases completed.**

The current application includes:

* Authentication
* Customer management
* Enquiry management
* Package management
* Quotations
* Bookings
* Trips
* Payments
* Expenses
* Profit calculation
* Invoices
* PDF generation
* WhatsApp invoice sharing
* Reviews
* Trip Calendar
* Simple business summaries
* Simple reports
* Responsive navigation
* Regression testing

The next stage is **deployment and real-world validation**.

---

# 🔮 Future Possibilities

Future development may include:

* Dedicated platform administration
* Customer-facing services
* Multi-business platform capabilities
* Additional integrations
* Features based on real user feedback

These are outside the current TripMate development scope.

---

# 👨‍💻 Developer

### Mathavan

BCA Student | Full-Stack Development & Data Analytics Enthusiast

**GitHub:**
https://github.com/mathavan-web

---

# 📄 License

This project was developed as a personal/academic project.

If this repository is later released as open source, an appropriate open-source license can be added here.

---

## ⭐ If you find this project interesting

Feel free to explore the repository and follow the development journey.

**TripMate — Simple tools for managing real-world travel businesses.**
