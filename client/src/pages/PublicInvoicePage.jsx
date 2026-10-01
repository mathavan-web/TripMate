import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PublicInvoicePage() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInvoice = async () => {
      if (!token) {
        setError('This invoice link is invalid or unavailable.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/invoices/${token}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load invoice');
        }

        setInvoice(payload.data);
      } catch (err) {
        setError(err.message || 'Unable to load invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [token]);

  if (loading) {
    return <div className="page-shell"><div className="card-block"><h2>Loading invoice...</h2></div></div>;
  }

  if (error || !invoice) {
    return <div className="page-shell"><div className="card-block"><h2>Invoice unavailable</h2><p>{error || 'This invoice link is invalid or unavailable.'}</p></div></div>;
  }

  const business = invoice.businessSnapshot || {};
  const customer = invoice.customerSnapshot || {};
  const trip = invoice.tripSnapshot || {};

  return (
    <div className="page-shell">
      <div className="card-block invoice-public-card">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Invoice</p>
            <h2>{invoice.invoiceNumber}</h2>
          </div>
          <div className="toolbar-actions">
            <a className="secondary-button" href={`${API_BASE_URL}/api/public/invoices/${token}/pdf`} target="_blank" rel="noreferrer">Download PDF</a>
          </div>
        </div>

        <div className="invoice-public-header">
          <div>
            {business.logo ? <img src={business.logo} alt={business.businessName || 'Business logo'} className="invoice-logo" /> : <div className="brand-mark large">T</div>}
          </div>
          <div>
            <h3>{business.businessName || 'Business'}</h3>
            <p>{business.address || 'Address not provided'}</p>
            <p>{business.phone || 'Phone not provided'} · {business.email || 'Email not provided'}</p>
          </div>
        </div>

        <div className="invoice-grid">
          <div className="detail-card">
            <strong>Invoice details</strong>
            <span>
              Invoice No: {invoice.invoiceNumber}<br />
              Date: {formatDate(invoice.invoiceDate)}<br />
              Status: <span className={`status-badge ${String(invoice.paymentStatus || 'UNPAID').toLowerCase().replaceAll('_', '-')}`}>{invoice.paymentStatus || 'UNPAID'}</span>
            </span>
          </div>

          <div className="detail-card">
            <strong>Customer</strong>
            <span>
              {customer.name || 'Customer'}<br />
              {customer.phone || 'Phone not provided'}<br />
              {customer.email || 'Email not provided'}
            </span>
          </div>

          <div className="detail-card full-width">
            <strong>Trip details</strong>
            <span>
              Package: {trip.packageName || 'Trip package'}<br />
              Dates: {formatDate(trip.travelDate)} {trip.returnDate ? `to ${formatDate(trip.returnDate)}` : ''}<br />
              Pickup: {trip.pickupLocation || '—'}<br />
              Destination: {trip.destination || '—'}<br />
              Vehicle: {trip.vehicleType || '—'} · {trip.vehicleNumber || '—'}<br />
              Passengers: {trip.passengerCount || '—'}
            </span>
          </div>
        </div>

        <div className="invoice-summary">
          <h3>Payment summary</h3>
          <div className="summary-row"><span>Total</span><strong>{formatCurrency(invoice.totalAmount)}</strong></div>
          <div className="summary-row"><span>Paid</span><strong>{formatCurrency(invoice.amountPaid)}</strong></div>
          <div className="summary-row"><span>Balance</span><strong>{formatCurrency(invoice.balanceDue)}</strong></div>
          <div className="summary-row"><span>Status</span><strong>{invoice.paymentStatus || 'UNPAID'}</strong></div>
        </div>

        <div className="invoice-footer">
          <p>Thank you for choosing {business.businessName || 'our service'}.</p>
          <p>{business.phone || 'Phone not provided'} · {business.email || 'Email not provided'}</p>
        </div>
      </div>
    </div>
  );
}

export default PublicInvoicePage;
