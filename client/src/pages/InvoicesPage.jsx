import { useEffect, useMemo, useState } from 'react';
import request, { requestFile } from '../services/api';

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reviewLink, setReviewLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [invoiceResponse, reviewResponse] = await Promise.all([request('/invoices'), request('/reviews')]);
      setInvoices(invoiceResponse.data || []);
      setReviews(reviewResponse.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const keyword = search.trim().toLowerCase();
    const matchesText = !keyword || [invoice.invoiceNumber, invoice.customerSnapshot?.name, invoice.tripSnapshot?.bookingNumber]
      .some((value) => String(value || '').toLowerCase().includes(keyword));
    return matchesText && (paymentFilter === 'All' || invoice.paymentStatus === paymentFilter);
  }), [invoices, search, paymentFilter]);

  const runAction = async (invoice, action, successMessage) => {
    setBusyId(invoice._id);
    setError('');
    setSuccess('');
    try {
      await request(`/invoices/${invoice._id}/${action}`, { method: 'POST' });
      setSuccess(successMessage);
      await loadData();
    } catch (err) {
      setError(err.message || 'Invoice action failed');
      await loadData();
    } finally {
      setBusyId('');
    }
  };

  const downloadPdf = async (invoice) => {
    setBusyId(invoice._id);
    setError('');
    try {
      const blob = await requestFile(`/invoices/${invoice._id}/pdf`);
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Unable to download invoice PDF');
    } finally {
      setBusyId('');
    }
  };

  const createReviewLink = async (invoice) => {
    setBusyId(invoice._id);
    setError('');
    setSuccess('');
    try {
      const response = await request(`/invoices/${invoice._id}/review-invitation`, { method: 'POST' });
      setReviewLink(`${window.location.origin}/review/${response.data.token}`);
      setSuccess('Review link created. Share it with the customer.');
    } catch (err) {
      setError(err.message || 'Unable to create review link');
    } finally {
      setBusyId('');
    }
  };

  const shareViaWhatsApp = async (invoice) => {
    setBusyId(invoice._id);
    setError('');
    setSuccess('');
    try {
      const response = await request(`/invoices/${invoice._id}/whatsapp-share`, { method: 'POST' });
      const shareUrl = response.data?.whatsappUrl;
      if (!shareUrl) {
        throw new Error('WhatsApp share link is unavailable');
      }
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setSuccess('WhatsApp share link opened.');
    } catch (err) {
      setError(err.message || 'Unable to open WhatsApp');
    } finally {
      setBusyId('');
    }
  };

  const reviewedTrips = new Set(reviews.map((review) => String(review.trip?._id || review.trip)));

  return (
    <div className="page-shell">
      <section className="card-block">
        <div className="page-toolbar">
          <div><p className="eyebrow">Billing history</p><h2>Invoices</h2></div>
          <div className="toolbar-actions">
            <input className="search-box" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, customer, booking" />
            <select className="filter-control" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="All">All payment states</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        {reviewLink && <label className="full-width">Customer review link<input readOnly value={reviewLink} onFocus={(event) => event.target.select()} /></label>}

        {loading ? <div className="empty-card compact"><h3>Loading invoices...</h3></div> : filteredInvoices.length === 0 ? (
          <div className="empty-card compact"><h3>No invoices yet</h3><p>Invoices are created when a trip is completed.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Trip / Booking</th><th>Total</th><th>Payment</th><th>PDF</th><th>WhatsApp</th><th>Actions</th></tr></thead>
              <tbody>{filteredInvoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td><button type="button" className="link-button" onClick={() => setSelectedInvoice(invoice)}>{invoice.invoiceNumber}</button><br /><small>{new Date(invoice.invoiceDate).toLocaleDateString()}</small></td>
                  <td>{invoice.customerSnapshot?.name}<br /><small>{invoice.customerSnapshot?.phone}</small></td>
                  <td>{invoice.tripSnapshot?.destination || invoice.tripSnapshot?.packageName || 'Trip'}<br /><small>{invoice.tripSnapshot?.bookingNumber}</small></td>
                  <td>₹{Number(invoice.totalAmount).toLocaleString('en-IN')}</td>
                  <td><span className={`status-badge ${invoice.paymentStatus.toLowerCase().replaceAll('_', '-')}`}>{invoice.paymentStatus.replaceAll('_', ' ')}</span><br /><small>Due ₹{Number(invoice.balanceDue).toLocaleString('en-IN')}</small></td>
                  <td>{invoice.pdfStatus}</td>
                  <td>{invoice.whatsappStatus}</td>
                  <td><div className="table-actions">
                    {invoice.pdfStatus === 'GENERATED'
                      ? <button type="button" className="text-button" disabled={busyId === invoice._id} onClick={() => downloadPdf(invoice)}>PDF</button>
                      : <button type="button" className="text-button" disabled={busyId === invoice._id} onClick={() => runAction(invoice, 'retry-pdf', 'PDF retry completed.')}>Retry PDF</button>}
                    {invoice.customerSnapshot?.whatsapp || invoice.customerSnapshot?.phone
                      ? <button type="button" className="whatsapp-button" disabled={busyId === invoice._id} onClick={() => shareViaWhatsApp(invoice)}>WhatsApp</button>
                      : <button type="button" className="whatsapp-button disabled" disabled>WhatsApp</button>}
                    {!reviewedTrips.has(String(invoice.trip)) && <button type="button" className="text-button" disabled={busyId === invoice._id} onClick={() => createReviewLink(invoice)}>Review link</button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {selectedInvoice && <section className="card-block">
        <div className="page-toolbar"><div><p className="eyebrow">Invoice detail</p><h2>{selectedInvoice.invoiceNumber}</h2></div><button type="button" className="secondary-button" onClick={() => setSelectedInvoice(null)}>Close</button></div>
        <div className="detail-grid">
          <div className="detail-card"><strong>Business</strong><span>{selectedInvoice.businessSnapshot.businessName}<br />{selectedInvoice.businessSnapshot.phone}<br />{selectedInvoice.businessSnapshot.email}<br />{selectedInvoice.businessSnapshot.address}</span></div>
          <div className="detail-card"><strong>Customer</strong><span>{selectedInvoice.customerSnapshot.name}<br />{selectedInvoice.customerSnapshot.phone}<br />{selectedInvoice.customerSnapshot.email}<br />{selectedInvoice.customerSnapshot.address}</span></div>
          <div className="detail-card"><strong>Trip</strong><span>{selectedInvoice.tripSnapshot.packageName || selectedInvoice.tripSnapshot.destination}<br />{selectedInvoice.tripSnapshot.pickupLocation} to {selectedInvoice.tripSnapshot.dropLocation}<br />Booking {selectedInvoice.tripSnapshot.bookingNumber}<br />{selectedInvoice.tripSnapshot.vehicleNumber}</span></div>
          <div className="detail-card"><strong>Amounts</strong><span>Total ₹{Number(selectedInvoice.totalAmount).toLocaleString('en-IN')}<br />Paid ₹{Number(selectedInvoice.amountPaid).toLocaleString('en-IN')}<br />Due ₹{Number(selectedInvoice.balanceDue).toLocaleString('en-IN')}<br />{selectedInvoice.paymentStatus}</span></div>
        </div>
        <div className="toolbar-actions" style={{ marginTop: '16px', justifyContent: 'flex-start' }}>
          {selectedInvoice.customerSnapshot?.whatsapp || selectedInvoice.customerSnapshot?.phone ? (
            <button type="button" className="whatsapp-button" onClick={() => shareViaWhatsApp(selectedInvoice)}>🟢 Send via WhatsApp</button>
          ) : (
            <button type="button" className="whatsapp-button disabled" disabled>Customer WhatsApp number is not available</button>
          )}
        </div>
      </section>}
    </div>
  );
}

export default InvoicesPage;