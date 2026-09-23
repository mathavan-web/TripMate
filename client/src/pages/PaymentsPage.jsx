import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];
const paymentTypes = ['Advance', 'Partial Payment', 'Final Payment', 'Refund'];
const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  booking: '',
  trip: '',
  amount: '',
  paymentDate: today,
  paymentMethod: 'Cash',
  paymentType: 'Advance',
  referenceNumber: '',
  notes: '',
};

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, bookingsResponse, tripsResponse] = await Promise.all([
        request('/payments'),
        request('/bookings'),
        request('/trips'),
      ]);
      setPayments(paymentsResponse.data || []);
      setBookings(bookingsResponse.data || []);
      setTrips(tripsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || [
      payment.paymentNumber,
      payment.customer?.name,
      payment.booking?.bookingNumber,
      payment.referenceNumber,
    ].some((value) => String(value || '').toLowerCase().includes(keyword));
    return matchesSearch
      && (methodFilter === 'All' || payment.paymentMethod === methodFilter)
      && (typeFilter === 'All' || payment.paymentType === typeFilter);
  }), [payments, search, methodFilter, typeFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm, paymentDate: today });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, amount: Number(form.amount), trip: form.trip || null };
      if (editingId) {
        await request(`/payments/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Payment updated successfully.');
      } else {
        await request('/payments', { method: 'POST', body: payload });
        setSuccess('Payment created successfully.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save payment');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment._id);
    setForm({
      booking: payment.booking?._id || '',
      trip: payment.trip?._id || '',
      amount: payment.amount || '',
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 10) : today,
      paymentMethod: payment.paymentMethod || 'Cash',
      paymentType: payment.paymentType || 'Advance',
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await request(`/payments/${paymentId}`, { method: 'DELETE' });
      setSuccess('Payment deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to delete payment');
    }
  };

  const selectedBooking = bookings.find((booking) => booking._id === form.booking);
  const availableTrips = trips.filter((trip) => !form.booking || trip.booking?._id === form.booking || trip.booking === form.booking);
  const selectedBookingPaid = payments
    .filter((payment) => payment.booking?._id === form.booking || payment.booking === form.booking)
    .reduce((total, payment) => total + (payment.paymentType === 'Refund' ? -Number(payment.amount || 0) : Number(payment.amount || 0)), 0);
  const selectedBookingBalance = selectedBooking ? Math.max(0, Number(selectedBooking.totalAmount || 0) - selectedBookingPaid) : null;

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div><p className="eyebrow">Payment management</p><h2>Payments</h2></div>
          <div className="toolbar-actions">
            <input className="search-box" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search payment or booking" />
            <button type="button" className="primary-button" onClick={resetForm}>{editingId ? 'New payment' : '+ Add Payment'}</button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="filter-row" style={{ marginTop: '18px' }}>
          <select className="filter-control" value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
            <option value="All">All methods</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
          <select className="filter-control" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="All">All types</option>{paymentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '18px' }}>
          <label>Booking<select name="booking" value={form.booking} onChange={(event) => setForm((previous) => ({ ...previous, booking: event.target.value, trip: '' }))} required>
            <option value="">Select booking</option>{bookings.map((booking) => <option key={booking._id} value={booking._id}>{booking.bookingNumber} - {booking.customer?.name || 'Customer'}</option>)}
          </select></label>
          <label>Trip<select name="trip" value={form.trip} onChange={handleChange}>
            <option value="">No trip linked</option>{availableTrips.map((trip) => <option key={trip._id} value={trip._id}>{trip.booking?.bookingNumber || 'Trip'} - {trip.destination || 'Destination'}</option>)}
          </select></label>
          <label>Amount<input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={handleChange} required /></label>
          <label>Payment Date<input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} required /></label>
          <label>Payment Method<select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <label>Payment Type<select name="paymentType" value={form.paymentType} onChange={handleChange}>{paymentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label>Reference Number<input name="referenceNumber" value={form.referenceNumber} onChange={handleChange} /></label>
          <label>Booking Balance<input value={selectedBooking ? `₹${selectedBookingBalance.toLocaleString('en-IN')}` : 'Select a booking'} readOnly /></label>
          <label className="full-width">Notes<textarea name="notes" value={form.notes} onChange={handleChange} rows="2" /></label>
          <div className="table-actions"><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Payment' : 'Save Payment'}</button>{editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}</div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading"><h2>Payment list</h2><p>Track advances, partial payments, final payments, and refunds.</p></div>
        {loading ? <div className="empty-card"><h3>Loading payments...</h3></div> : filteredPayments.length === 0 ? <div className="empty-card"><h3>No payments yet.</h3><p>Payments recorded against bookings will appear here.</p></div> : (
          <div className="table-wrapper"><table className="data-table"><thead><tr><th>Payment</th><th>Customer</th><th>Booking</th><th>Amount</th><th>Date</th><th>Method</th><th>Type</th><th>Reference</th><th>Actions</th></tr></thead><tbody>
            {filteredPayments.map((payment) => <tr key={payment._id}><td>{payment.paymentNumber}</td><td>{payment.customer?.name || '-'}</td><td>{payment.booking?.bookingNumber || '-'}</td><td>₹{Number(payment.amount || 0).toLocaleString('en-IN')}</td><td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</td><td>{payment.paymentMethod}</td><td>{payment.paymentType}</td><td>{payment.referenceNumber || '-'}</td><td><div className="table-actions"><button type="button" className="text-button" onClick={() => handleEdit(payment)}>Edit</button><button type="button" className="secondary-button danger" onClick={() => handleDelete(payment._id)}>Delete</button></div></td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}

export default PaymentsPage;
