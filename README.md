# TripMate

TripMate is a business-management platform for local travel operators, taxi drivers, vehicle owners, and small tour businesses. The project now includes the Phase 1 foundation plus a Phase 2 Customer and Enquiry Management layer.

## Technology Stack

- React
- Node.js
- Express
- MongoDB
- JWT

## Project Structure

- `client/` — React frontend application
- `server/` — Express.js backend with REST APIs
- `.env` — local environment variables

## Installation

```bash
cd client
npm install

cd ../server
npm install
```

## Environment Variables

Create a `.env` file in the server folder with:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tripmate
JWT_SECRET=your_secure_secret_here
```

## Running the Application

Frontend:

```bash
cd client
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

## API Health Check

```bash
GET http://localhost:5000/api/health
```

## Phase 1 Features

- User registration and login
- JWT-based protected routes
- Dashboard access for authenticated users
- Profile management
- Business profile creation and updates
- Responsive layout and mobile-friendly navigation
- Centralized validation and error handling

## Phase 2 Features

- Customer management module with create, search, edit, and archive flows
- Customer ownership validation tied to the authenticated business/account
- Enquiry management module with status tracking and filters
- Customer-to-enquiry relationship using MongoDB references
- Dashboard stats fed from real customer and enquiry data
- Responsive Phase 2 list and form UI using the existing TripMate design system

## Notes

- Authentication remains enforced for protected routes.
- Customer and enquiry records are scoped to the logged-in user/business.
- The project is intentionally kept aligned with future workflow phases without introducing quotation, booking, or trip modules yet.

## Future Development

Future phases will add quotation, booking, trips, expenses, payments, invoices, and analytics.
