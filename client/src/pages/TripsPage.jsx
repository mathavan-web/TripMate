import { Fragment, useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const defaultForm = {
  booking: '',
  customer: '',
  travelDate: '',
  returnDate: '',
  pickupLocation: '',
  dropLocation: '',
  destination: '',
  driverName: '',
  driverPhone: '',
  licenseNumber: '',
  vehicleModel: '',
  vehicleNumber: '',
  vehicleType: '',
  passengerCount: 1,
  status: 'Scheduled',
  notes: '',
};

const tripStatusOptions = ['All', 'Scheduled', 'Started', 'Completed', 'Cancelled'];

function TripsPage() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [financialSummary, setFinancialSummary] = useState({});
  const [summaryLoadingId, setSummaryLoadingId] = useState(null);
  const confirmedBookings = bookings.filter((booking) => booking.status === 'Confirmed');

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, customersResponse, tripsResponse] = await Promise.all([
        request('/bookings'),
        request('/customers'),
        request('/trips'),
      ]);

      setBookings(bookingsResponse.data || []);
      setCustomers(customersResponse.data || []);
      setTrips(tripsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword || [
        trip.booking?.bookingNumber,
        trip.customer?.name,
        trip.destination,
        trip.driverName,
        trip.vehicleNumber,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [trips, search, statusFilter]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        passengerCount: Number(form.passengerCount || 1),
      };

      if (editingId) {
        await request(`/trips/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Trip updated successfully.');
      } else {
        await request('/trips', { method: 'POST', body: payload });
        setSuccess('Trip created successfully.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save trip');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (trip) => {
    setEditingId(trip._id);
    setForm({
      booking: trip.booking?._id || '',
      customer: trip.customer?._id || '',
      travelDate: trip.travelDate ? new Date(trip.travelDate).toISOString().slice(0, 10) : '',
      returnDate: trip.returnDate ? new Date(trip.returnDate).toISOString().slice(0, 10) : '',
      pickupLocation: trip.pickupLocation || '',
      dropLocation: trip.dropLocation || '',
      destination: trip.destination || '',
      driverName: trip.driverName || '',
      driverPhone: trip.driverPhone || '',
      licenseNumber: trip.licenseNumber || '',
      vehicleModel: trip.vehicleModel || '',
      vehicleNumber: trip.vehicleNumber || '',
      vehicleType: trip.vehicleType || '',
      passengerCount: trip.passengerCount || 1,
      status: trip.status || 'Scheduled',
      notes: trip.notes || '',
    });
  };

  const handleStatusUpdate = async (tripId, status) => {
    try {
      await request(`/trips/${tripId}/status`, { method: 'PATCH', body: { status } });
      await loadData();
      setSuccess('Trip status updated.');
    } catch (err) {
      setError(err.message || 'Unable to update trip status');
    }
  };

  const loadFinancialSummary = async (tripId) => {
    setSummaryLoadingId(tripId);
    setError('');
    try {
      const response = await request(`/trips/${tripId}/financial-summary`);
      setFinancialSummary((previous) => ({ ...previous, [tripId]: response.data }));
    } catch (err) {
      setError(err.message || 'Unable to load trip financial summary');
    } finally {
      setSummaryLoadingId(null);
    }
  };

  const selectedBooking = bookings.find((booking) => booking._id === form.booking);

  useEffect(() => {
    if (selectedBooking) {
      setForm((prev) => ({
        ...prev,
        customer: prev.customer || selectedBooking.customer?._id || '',
        travelDate: prev.travelDate || (selectedBooking.travelDate ? new Date(selectedBooking.travelDate).toISOString().slice(0, 10) : ''),
        returnDate: prev.returnDate || (selectedBooking.returnDate ? new Date(selectedBooking.returnDate).toISOString().slice(0, 10) : ''),
        pickupLocation: prev.pickupLocation || selectedBooking.pickupLocation || '',
        dropLocation: prev.dropLocation || selectedBooking.dropLocation || '',
        destination: prev.destination || selectedBooking.destination || '',
        vehicleType: prev.vehicleType || selectedBooking.vehicleType || '',
        passengerCount: prev.passengerCount || selectedBooking.numberOfPassengers || 1,
      }));
    }
  }, [selectedBooking]);

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Trip management</p>
            <h2>Trips</h2>
          </div>
          <div className="toolbar-actions">
            <input
              className="search-box"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search trip or driver"
            />
            <button type="button" className="primary-button" onClick={() => resetForm()}>
              {editingId ? 'New trip' : '+ New Trip'}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="filter-row" style={{ marginTop: '18px' }}>
          <select className="filter-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {tripStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '18px' }}>
          <label>
            Booking
            <select name="booking" value={form.booking} onChange={handleChange} required>
              <option value="">Select confirmed booking</option>
              {confirmedBookings.map((booking) => <option key={booking._id} value={booking._id}>{booking.bookingNumber}</option>)}
            </select>
          </label>

          <label>
            Customer
            <select name="customer" value={form.customer} onChange={handleChange} required>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
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
            Driver Name
            <input name="driverName" value={form.driverName} onChange={handleChange} />
          </label>

          <label>
            Driver Phone
            <input name="driverPhone" value={form.driverPhone} onChange={handleChange} />
          </label>

          <label>
            License Number
            <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
          </label>

          <label>
            Vehicle Model
            <input name="vehicleModel" value={form.vehicleModel} onChange={handleChange} />
          </label>

          <label>
            Vehicle Number
            <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} />
          </label>

          <label>
            Vehicle Type
            <input name="vehicleType" value={form.vehicleType} onChange={handleChange} />
          </label>

          <label>
            Passenger Count
            <input type="number" min="1" name="passengerCount" value={form.passengerCount} onChange={handleChange} />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {tripStatusOptions.filter((option) => option !== 'All').map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="full-width">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
          </label>

          <div className="toolbar-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Trip' : 'Create Trip')}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading">
          <h2>Trip list</h2>
          <p>Track scheduled, active, and completed journeys.</p>
        </div>

        {loading ? (
          <div className="empty-card compact"><h3>Loading trips...</h3></div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-card compact">
            <h3>No trips yet.</h3>
            <p>Create a trip once a booking is confirmed.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip/Booking</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Travel Date</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip) => {
                  const summary = financialSummary[trip._id];
                  return (
                    <Fragment key={trip._id}>
                      <tr>
                        <td>{trip.booking?.bookingNumber || 'Trip'}</td>
                        <td>{trip.customer?.name || '-'}</td>
                        <td>{trip.destination || '-'}</td>
                        <td>{trip.travelDate ? new Date(trip.travelDate).toLocaleDateString() : '-'}</td>
                        <td>{trip.driverName || '-'}</td>
                        <td>{trip.vehicleNumber || trip.vehicleModel || '-'}</td>
                        <td><span className={`status-badge ${String(trip.status).toLowerCase().replace(/\s+/g, '-')}`}>{trip.status}</span></td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="link-button" onClick={() => handleEdit(trip)}>Edit</button>
                            <button type="button" className="text-button" onClick={() => handleStatusUpdate(trip._id, 'Started')}>Start</button>
                            <button type="button" className="text-button" onClick={() => loadFinancialSummary(trip._id)}>{summaryLoadingId === trip._id ? 'Loading...' : 'Financials'}</button>
                          </div>
                        </td>
                      </tr>
                      {summary && <tr><td colSpan="8"><div className="empty-card compact"><h3>Trip financial summary</h3><p>Revenue: ₹{Number(summary.revenue || 0).toLocaleString('en-IN')} · Amount Paid: ₹{Number(summary.totalPaid || 0).toLocaleString('en-IN')} · Balance: ₹{Number(summary.balance || 0).toLocaleString('en-IN')} · Expenses: ₹{Number(summary.totalExpenses || 0).toLocaleString('en-IN')} · Profit: ₹{Number(summary.profit || 0).toLocaleString('en-IN')}</p><p>Payments: {(summary.payments || []).length} · Expenses: {(summary.expenses || []).length}</p></div></td></tr>}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripsPage;
