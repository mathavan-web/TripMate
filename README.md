🚕 TripMate

TripMate is a MERN-based business management platform designed for
local taxi drivers, jeep safari operators, tour operators, and vehicle
owners to manage their travel business operations from a single
platform.

It provides a structured workflow for managing customers, enquiries,
travel packages, quotations, bookings, trips, expenses, payments,
invoices, and business analytics, with features being introduced
progressively throughout development.

🚧 TripMate is currently under active development.

📌 Project Status

TripMate is being developed progressively through multiple phases.

Completed

✅ Phase 1 --- Foundation & Authentication

✅ Phase 2 --- Customer & Enquiry Management

✅ Phase 3 --- Package & Quotation Management

Upcoming

🚧 Phase 4 --- Booking & Trip Management

🚧 Phase 5 --- Expenses, Payments & Profit

🚧 Phase 6 --- Invoices & Reviews

🚧 Phase 7 --- Reports, Analytics & Final Polish

✨ Implemented Features

🔐 Authentication & User Management

User registration

Secure login

JWT authentication

Protected routes

User roles

Profile management

Business profile

👥 Customer Management

Add customers

View customers

Search customers

Edit customer information

Customer details

Customer ownership

📩 Enquiry Management

Create enquiries

Customer-enquiry relationship

Search enquiries

Filter enquiries

Enquiry status management

Enquiry details

📦 Package Management

Create travel packages

Package details

Package pricing

Destinations

Inclusions and exclusions

Package activation/deactivation

Package search and filtering

🧾 Quotation Management

Create quotations from enquiries

Package selection

Quotation pricing

Line items

Discount

Tax

Advance amount

Balance calculation

Quotation status

Quotation preview

Quotation PDF generation

🔄 Application Workflow

Customer
   ↓
Enquiry
   ↓
Package Selection
   ↓
Quotation
   ↓
Booking
   ↓
Trip
   ↓
Expenses & Payments
   ↓
Invoice
   ↓
Review & Customer History

The workflow represents the long-term direction of TripMate. Some stages
are planned for upcoming development phases.

💡 Why TripMate?

Many small travel businesses manage customers, enquiries, quotations,
bookings, expenses, and payments using notebooks, spreadsheets, or
multiple disconnected applications.

TripMate aims to bring these business operations together into a single,
structured platform.

The project focuses on building a practical and scalable solution that
can grow with the needs of small travel businesses.

🛠️ Technology Stack

Frontend

React.js

JavaScript

React Router

Responsive UI

Backend

Node.js

Express.js

REST API

Database

MongoDB

Mongoose

Authentication

JWT

Secure password hashing

Development

Visual Studio Code

Git

GitHub

AI-assisted development with GitHub Copilot

🎨 Design System

TripMate uses a consistent professional colour palette throughout the
application.

Purpose      Colour

Primary      #1565C0
Secondary    #00A896
Accent       #FF9800
Background   #F5F7FA
Card         #FFFFFF
Text         #172B4D
Success      #2E7D32
Warning      #F9A825
Error        #D32F2F

The same design system is maintained across all development phases to
provide a consistent user experience.

🏗️ Project Structure

TripMate/
│
├── client/
│   └── React frontend
│
├── server/
│   └── Node.js + Express backend
│
├── .gitignore
├── README.md
└── package configuration

The structure above provides a high-level overview. The project may
evolve as additional modules are introduced.

🚀 Getting Started

1. Clone the repository

git clone https://github.com/mathavan-web/TripMate.git

2. Navigate to the project

cd TripMate

3. Install frontend dependencies

cd client
npm install

4. Install backend dependencies

cd ../server
npm install

5. Configure environment variables

Create the required .env file inside the backend according to the
project's configuration.

Do not commit .env files or secrets to GitHub.

6. Start the backend

cd server
npm run dev

7. Start the frontend

Open another terminal:

cd client
npm run dev

If the project's scripts or folder structure change during
development, use the commands defined in the current package.json
files.

🔒 Security

TripMate follows application security practices including:

JWT-based authentication

Secure password hashing

Protected API routes

Role-based authorization

Resource ownership checks

Input validation

Environment variables for sensitive configuration

🗺️ Development Roadmap

Phase 1
Foundation & Authentication
        ↓
Phase 2
Customers & Enquiries
        ↓
Phase 3
Packages & Quotations
        ↓
Phase 4
Bookings & Trips
        ↓
Phase 5
Expenses, Payments & Profit
        ↓
Phase 6
Invoices & Reviews
        ↓
Phase 7
Reports, Analytics & Final Polish

📈 Development Approach

TripMate is being developed incrementally, with each phase building on
the functionality introduced in the previous phase.

The development approach focuses on:

Modular architecture

Reusable components

Secure API design

Consistent UI/UX

Data relationships between business modules

Progressive feature development

Maintainability and future scalability

📌 Development Status

TripMate is an ongoing development project.

New features and business-management modules will be added progressively
in future phases. The current repository represents the development
progress completed so far and should not be considered the final
production release.

👨‍💻 Development

Built as a practical full-stack development project using the MERN
stack.

TripMate --- Manage your travel business in one place. 🚕