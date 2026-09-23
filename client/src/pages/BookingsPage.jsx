import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const defaultForm = {
  customer: '',
  enquiry: '',
  quotation: '',
  package: '',
  travelDate: '',
  returnDate: '',
  pickupLocation: '',
  dropLocation: '',
  destination: '',
  numberOfPassengers: 1,
  vehicleType: '',
  specialRequirements: '',
  totalAmount: 0,
  advanceAmount: 0,
  status: 'Pending',
  notes: '',
};

const bookingStatusOptions = ['All', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

function BookingsPage() {
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [packages, setPackages] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersResponse, enquiriesResponse, packagesResponse, quotationsResponse, bookingsResponse] = await Promise.all([
        request('/customers'),
        request('/enquiries'),
        request('/packages'),
        request('/quotations'),
        request('/bookings'),
      ]);

      setCustomers(customersResponse.data || []);
      setEnquiries(enquiriesResponse.data || []);
      setPackages((packagesResponse.data || []).filter((pkg) => pkg.isActive));
      setQuotations((quotationsResponse.data || []).filter((quote) => quote.status === 'Accepted'));
      setBookings(bookingsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword || [
        booking.bookingNumber,
        booking.customer?.name,
        booking.destination,
        booking.pickupLocation,
        booking.dropLocation,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const populateFromQuotation = async (quoteId) => {
    const quote = quotations.find((item) => item._id === quoteId);
    if (!quote) return;

    setForm((prev) => ({
      ...prev,
      customer: quote.customer?._id || prev.customer,
      enquiry: quote.enquiry?._id || prev.enquiry,
      quotation: quote._id,
      package: quote.package?._id || prev.package,
      travelDate: quote.travelDate ? new Date(quote.travelDate).toISOString().slice(0, 10) : prev.travelDate,
      returnDate: quote.returnDate ? new Date(quote.returnDate).toISOString().slice(0, 10) : prev.returnDate,
      pickupLocation: quote.pickupLocation || prev.pickupLocation,
      dropLocation: quote.dropLocation || prev.dropLocation,
      destination: quote.destination || prev.destination,
      numberOfPassengers: quote.passengers || prev.numberOfPassengers || 1,
      vehicleType: quote.vehicleType || prev.vehicleType,
      totalAmount: quote.totalAmount || prev.totalAmount || 0,
      advanceAmount: quote.advanceAmount || prev.advanceAmount || 0,
      notes: quote.notes || prev.notes,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        numberOfPassengers: Number(form.numberOfPassengers || 1),
        totalAmount: Number(form.totalAmount || 0),
        advanceAmount: Number(form.advanceAmount || 0),
      };

      if (editingId) {
        await request(`/bookings/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Booking updated successfully.');
      } else {
        await request('/bookings', { method: 'POST', body: payload });
        setSuccess('Booking created successfully.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save booking');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (booking) => {
    setEditingId(booking._id);
    setForm({
      customer: booking.customer?._id || '',
      enquiry: booking.enquiry?._id || '',
      quotation: booking.quotation?._id || '',
      package: booking.package?._id || '',
      travelDate: booking.travelDate ? new Date(booking.travelDate).toISOString().slice(0, 10) : '',
      returnDate: booking.returnDate ? new Date(booking.returnDate).toISOString().slice(0, 10) : '',
      pickupLocation: booking.pickupLocation || '',
      dropLocation: booking.dropLocation || '',
      destination: booking.destination || '',
      numberOfPassengers: booking.numberOfPassengers || 1,
      vehicleType: booking.vehicleType || '',
      specialRequirements: booking.specialRequirements || '',
      totalAmount: booking.totalAmount || 0,
      advanceAmount: booking.advanceAmount || 0,
      status: booking.status || 'Pending',
      notes: booking.notes || '',
    });
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await request(`/bookings/${bookingId}/status`, { method: 'PATCH', body: { status } });
      await loadData();
      setSuccess('Booking status updated.');
    } catch (err) {
      setError(err.message || 'Unable to update booking status');
    }
  };

  const balanceAmount = Math.max(0, Number(form.totalAmount || 0) - Number(form.advanceAmount || 0));

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Booking management</p>
            <h2>Bookings</h2>
          </div>
          <div className="toolbar-actions">
            <input
              className="search-box"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking or customer"
            />
            <button type="button" className="primary-button" onClick={() => resetForm()}>
              {editingId ? 'New booking' : '+ New Booking'}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="filter-row" style={{ marginTop: '18px' }}>
          <select className="filter-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {bookingStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '18px' }}>
          <label>
            Customer
            <select name="customer" value={form.customer} onChange={handleChange} required>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
            </select>
          </label>

          <label>
            Quotation
            <select name="quotation" value={form.quotation} onChange={(event) => { handleChange(event); if (event.target.value) populateFromQuotation(event.target.value); }}>
              <option value="">Optional accepted quotation</option>
              {quotations.map((quote) => <option key={quote._id} value={quote._id}>{quote.quotationNumber}</option>)}
            </select>
          </label>

          <label>
            Enquiry
            <select name="enquiry" value={form.enquiry} onChange={handleChange}>
              <option value="">Optional enquiry</option>
              {enquiries.map((enquiry) => <option key={enquiry._id} value={enquiry._id}>{enquiry.destination || 'Enquiry'}</option>)}
            </select>
          </label>

          <label>
            Package
            <select name="package" value={form.package} onChange={handleChange}>
              <option value="">Optional package</option>
              {packages.map((pkg) => <option key={pkg._id} value={pkg._id}>{pkg.name}</option>)}
            </select>
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {bookingStatusOptions.filter((option) => option !== 'All').map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label>
            Travel Date
            <input type="date" name="travelDate" value={form.travelDate} onChange={handleChange} required />
          </label>

          <label>
            Return Date
            <input type="date" name="returnDate" value={form.returnDate} onChange={handleChange} />
          </label>

          <label>
            Pickup Location
            <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} />
          </label>

          <label>
            Drop Location
            <input name="dropLocation" value={form.dropLocation} onChange={handleChange} />
          </label>

          <label>
            Destination
            <input name="destination" value={form.destination} onChange={handleChange} />
          </label>

          <label>
            Passengers
            <input type="number" min="1" name="numberOfPassengers" value={form.numberOfPassengers} onChange={handleChange} />
          </label>

          <label>
            Vehicle Type
            <input name="vehicleType" value={form.vehicleType} onChange={handleChange} />
          </label>

          <label>
            Total Amount
            <input type="number" min="0" name="totalAmount" value={form.totalAmount} onChange={handleChange} />
          </label>

          <label>
            Advance Amount
            <input type="number" min="0" name="advanceAmount" value={form.advanceAmount} onChange={handleChange} />
          </label>

          <label className="full-width">
            Special Requirements
            <textarea name="specialRequirements" value={form.specialRequirements} onChange={handleChange} rows="3" />
          </label>

          <label className="full-width">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
          </label>

          <div className="quote-total-box full-width">
            <div className="total-row"><span>Advance</span><strong>₹{Number(form.advanceAmount || 0).toLocaleString('en-IN')}</strong></div>
            <div className="total-row"><span>Balance</span><strong>₹{Number(balanceAmount).toLocaleString('en-IN')}</strong></div>
          </div>

          <div className="toolbar-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Booking' : 'Create Booking')}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading">
          <h2>Booking list</h2>
          <p>Manage confirmed travel demand and trip scheduling.</p>
        </div>

        {loading ? (
          <div className="empty-card compact"><h3>Loading bookings...</h3></div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-card compact">
            <h3>No bookings yet.</h3>
            <p>Create your first booking from an accepted quotation or travel enquiry.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Travel Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.bookingNumber}</td>
                    <td>{booking.customer?.name || '-'}</td>
                    <td>{booking.destination || '-'}</td>
                    <td>{booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : '-'}</td>
                    <td>₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`status-badge ${String(booking.status).toLowerCase().replace(/\s+/g, '-')}`}>{booking.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => handleEdit(booking)}>Edit</button>
                        <button type="button" className="text-button" onClick={() => handleStatusUpdate(booking._id, 'Confirmed')}>Confirm</button>
                        <button type="button" className="icon-button" onClick={() => handleStatusUpdate(booking._id, 'Cancelled')}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingsPage;
