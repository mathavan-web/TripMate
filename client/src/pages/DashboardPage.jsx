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
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [customersResponse, enquiriesResponse, packagesResponse, quotationsResponse] = await Promise.all([
          request('/customers'),
          request('/enquiries'),
          request('/packages'),
          request('/quotations'),
        ]);

        const customers = customersResponse.data || [];
        const enquiries = enquiriesResponse.data || [];
        const packages = packagesResponse.data || [];
        const quotations = quotationsResponse.data || [];

        setStats({
          totalCustomers: customers.length,
          totalEnquiries: enquiries.length,
          openEnquiries: enquiries.filter((enquiry) => ['New', 'Contacted', 'Quoted', 'Follow-up'].includes(enquiry.status)).length,
          confirmedEnquiries: enquiries.filter((enquiry) => enquiry.status === 'Confirmed').length,
          activePackages: packages.filter((pkg) => pkg.isActive).length,
          pendingQuotations: quotations.filter((quote) => ['Draft', 'Sent'].includes(quote.status)).length,
        });

        setRecentEnquiries(enquiries.slice(0, 5));
        setRecentQuotations(quotations.slice(0, 5));
      } catch (error) {
        setStats({ totalCustomers: 0, totalEnquiries: 0, openEnquiries: 0, confirmedEnquiries: 0, activePackages: 0, pendingQuotations: 0 });
        setRecentEnquiries([]);
        setRecentQuotations([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers, note: 'Customer records in your business', accent: 'blue' },
    { title: 'Total Enquiries', value: stats.totalEnquiries, note: 'Customer requests tracked', accent: 'teal' },
    { title: 'Open Enquiries', value: stats.openEnquiries, note: 'Active follow-up work', accent: 'orange' },
    { title: 'Active Packages', value: stats.activePackages, note: 'Packages ready for quoting', accent: 'green' },
    { title: 'Pending Quotations', value: stats.pendingQuotations, note: 'Draft and sent quotations', accent: 'blue' },
    { title: 'Confirmed', value: stats.confirmedEnquiries, note: 'Confirmed travel requests', accent: 'green' },
  ];

  return (
    <div className="page-shell">
      <section className="welcome-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Welcome back, {user?.name || 'Business Owner'}</h1>
          <p>Manage customer requests, enquiries, and business follow-ups in one place.</p>
        </div>
      </section>

      <section className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.title} className={`stat-card ${stat.accent}`}>
            <div className="stat-icon">•</div>
            <div className="stat-meta">
              <span>{stat.title}</span>
              <strong>{loading ? '...' : stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </div>
        ))}
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
    </div>
  );
}

export default DashboardPage;
