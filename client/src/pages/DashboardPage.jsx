import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import request from '../services/api';

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEnquiries: 0,
    openEnquiries: 0,
    confirmedEnquiries: 0,
    activePackages: 0,
    pendingQuotations: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    todaysTrips: 0,
    upcomingTrips: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    pendingPayments: 0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [customersResponse, enquiriesResponse, packagesResponse, quotationsResponse, bookingsResponse, tripsResponse, metricsResponse] = await Promise.all([
          request('/customers'),
          request('/enquiries'),
          request('/packages'),
          request('/quotations'),
          request('/bookings'),
          request('/trips'),
          request('/dashboard/metrics'),
        ]);

        const customers = customersResponse.data || [];
        const enquiries = enquiriesResponse.data || [];
        const packages = packagesResponse.data || [];
        const quotations = quotationsResponse.data || [];
        const bookings = bookingsResponse.data || [];
        const trips = tripsResponse.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingTripsData = trips.filter((trip) => {
          if (!trip.travelDate) return false;
          const tripDate = new Date(trip.travelDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate >= today;
        }).slice(0, 5);

        setStats({
          totalCustomers: customers.length,
          totalEnquiries: enquiries.length,
          openEnquiries: enquiries.filter((enquiry) => ['New', 'Contacted', 'Quoted', 'Follow-up'].includes(enquiry.status)).length,
          confirmedEnquiries: enquiries.filter((enquiry) => enquiry.status === 'Confirmed').length,
          activePackages: packages.filter((pkg) => pkg.isActive).length,
          pendingQuotations: quotations.filter((quote) => ['Draft', 'Sent'].includes(quote.status)).length,
          confirmedBookings: bookings.filter((booking) => booking.status === 'Confirmed').length,
          pendingBookings: bookings.filter((booking) => booking.status === 'Pending').length,
          todaysTrips: trips.filter((trip) => {
            if (!trip.travelDate) return false;
            const tripDate = new Date(trip.travelDate);
            return tripDate.toDateString() === today.toDateString();
          }).length,
          upcomingTrips: upcomingTripsData.length,
          ...(metricsResponse.data || {}),
        });

        setRecentEnquiries(enquiries.slice(0, 5));
        setRecentQuotations(quotations.slice(0, 5));
        setUpcomingTrips(upcomingTripsData);
      } catch (error) {
        setStats({
          totalCustomers: 0,
          totalEnquiries: 0,
          openEnquiries: 0,
          confirmedEnquiries: 0,
          activePackages: 0,
          pendingQuotations: 0,
          confirmedBookings: 0,
          pendingBookings: 0,
          todaysTrips: 0,
          upcomingTrips: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          pendingPayments: 0,
        });
        setRecentEnquiries([]);
        setRecentQuotations([]);
        setUpcomingTrips([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const operationalCards = [
    { title: 'Total Customers', value: stats.totalCustomers, note: 'Customer records in your business', accent: 'blue' },
    { title: 'Total Enquiries', value: stats.totalEnquiries, note: 'Customer requests tracked', accent: 'teal' },
    { title: 'Open Enquiries', value: stats.openEnquiries, note: 'Active follow-up work', accent: 'orange' },
    { title: 'Active Packages', value: stats.activePackages, note: 'Packages ready for quoting', accent: 'green' },
    { title: 'Pending Quotations', value: stats.pendingQuotations, note: 'Draft and sent quotations', accent: 'blue' },
    { title: 'Confirmed Bookings', value: stats.confirmedBookings, note: 'Bookings ready for execution', accent: 'green' },
    { title: 'Pending Bookings', value: stats.pendingBookings, note: 'Awaiting confirmation', accent: 'orange' },
    { title: "Today's Trips", value: stats.todaysTrips, note: 'Trips scheduled today', accent: 'teal' },
    { title: 'Upcoming Trips', value: stats.upcomingTrips, note: 'Trips in the near future', accent: 'blue' },
  ];

  const financialCards = [
    { title: 'Total Revenue', value: stats.totalRevenue, note: 'No revenue recorded yet', accent: 'green' },
    { title: 'Total Expenses', value: stats.totalExpenses, note: 'No expenses recorded yet', accent: 'orange' },
    { title: 'Total Profit', value: stats.totalProfit, note: 'No profit recorded yet', accent: 'teal' },
    { title: 'Pending Payments', value: stats.pendingPayments, note: 'No pending payments', accent: 'blue' },
  ];

  const renderStatCard = (stat, isFinancial = false) => (
    <div key={stat.title} className={`stat-card ${stat.accent}`}>
      <div className="stat-icon">•</div>
      <div className="stat-meta">
        <span>{stat.title}</span>
        <strong>{loading ? '...' : isFinancial ? `₹${Number(stat.value || 0).toLocaleString('en-IN')}` : stat.value}</strong>
        <small>{isFinancial && Number(stat.value || 0) > 0 ? stat.title === 'Total Revenue' ? 'Actual booking revenue' : stat.title === 'Total Expenses' ? 'Actual recorded expenses' : stat.title === 'Total Profit' ? 'Revenue less expenses' : 'Actual outstanding balance' : stat.note}</small>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <section className="welcome-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Welcome back, {user?.name || 'Business Owner'}</h1>
          <p>Manage customer requests, enquiries, and business follow-ups in one place.</p>
        </div>
      </section>

      <section>
        <div className="section-heading dashboard-section-heading">
          <h2>Operational Overview</h2>
          <p>Overview of your current bookings, quotations and trips.</p>
        </div>
        <div className="stats-grid">
          {operationalCards.map((stat) => renderStatCard(stat))}
        </div>
      </section>

      <section>
        <div className="section-heading dashboard-section-heading">
          <h2>Financial Overview</h2>
          <p>Overview of your actual business revenue, expenses and payments.</p>
        </div>
        <div className="stats-grid financial-stats-grid">
          {financialCards.map((stat) => renderStatCard(stat, true))}
        </div>
      </section>

      <section className="card-block">
        <div className="section-heading">
          <h2>Recent enquiries</h2>
          <p>Latest customer enquiries from your business.</p>
        </div>

        {recentEnquiries.length === 0 ? (
          <div className="empty-card compact">
            <h3>No recent enquiries</h3>
            <p>New enquiries from customers will appear here once they are created.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Travel Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEnquiries.map((enquiry) => (
                  <tr key={enquiry._id}>
                    <td>{enquiry.customer?.name || 'Customer'}</td>
                    <td>{enquiry.destination || '-'}</td>
                    <td>{enquiry.travelDate ? new Date(enquiry.travelDate).toLocaleDateString() : '-'}</td>
                    <td><span className={`status-badge ${String(enquiry.status).toLowerCase().replace(/\s+/g, '-')}`}>{enquiry.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-block">
        <div className="section-heading">
          <h2>Recent quotations</h2>
          <p>Latest quotation activity from your business.</p>
        </div>

        {recentQuotations.length === 0 ? (
          <div className="empty-card compact">
            <h3>No recent quotations</h3>
            <p>New quotations will appear here once they are created.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((quote) => (
                  <tr key={quote._id}>
                    <td>{quote.quotationNumber}</td>
                    <td>{quote.customer?.name || 'Customer'}</td>
                    <td>₹{Number(quote.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`status-badge ${String(quote.status).toLowerCase()}`}>{quote.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-block">
        <div className="section-heading">
          <h2>Upcoming trips</h2>
          <p>Trips scheduled for the near future.</p>
        </div>

        {upcomingTrips.length === 0 ? (
          <div className="empty-card compact">
            <h3>No upcoming trips</h3>
            <p>Once bookings are confirmed and trips are scheduled, they will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Travel Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTrips.map((trip) => (
                  <tr key={trip._id}>
                    <td>{trip.booking?.bookingNumber || 'Trip'}</td>
                    <td>{trip.customer?.name || 'Customer'}</td>
                    <td>{trip.destination || '-'}</td>
                    <td>{trip.travelDate ? new Date(trip.travelDate).toLocaleDateString() : '-'}</td>
                    <td><span className={`status-badge ${String(trip.status).toLowerCase().replace(/\s+/g, '-')}`}>{trip.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
