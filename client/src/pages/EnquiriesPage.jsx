import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const emptyForm = {
  customer: '',
  travelDate: '',
  returnDate: '',
  pickupLocation: '',
  dropLocation: '',
  destination: '',
  numberOfPassengers: 1,
  vehiclePreference: '',
  travelType: 'Local Trip',
  specialRequirements: '',
  estimatedAmount: '',
  notes: '',
  status: 'New',
};

const statusOptions = ['All', 'New', 'Contacted', 'Quoted', 'Follow-up', 'Confirmed', 'Cancelled', 'Lost'];
const travelTypeOptions = ['All', 'Local Trip', 'Outstation', 'Tour Package', 'Airport Transfer', 'Safari', 'One Way', 'Round Trip', 'Other'];

function EnquiriesPage() {
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [travelTypeFilter, setTravelTypeFilter] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersRes, enquiriesRes] = await Promise.all([
        request('/customers'),
        request('/enquiries'),
      ]);
      setCustomers(customersRes.data || []);
      setEnquiries(enquiriesRes.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const matchesStatus = statusFilter === 'All' || enquiry.status === statusFilter;
      const matchesType = travelTypeFilter === 'All' || enquiry.travelType === travelTypeFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword || [
        enquiry.customer?.name,
        enquiry.customer?.phone,
        enquiry.destination,
        enquiry.pickupLocation,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [enquiries, search, statusFilter, travelTypeFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
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
        numberOfPassengers: Number(form.numberOfPassengers || 1),
        estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : 0,
      };

      if (editingId) {
        await request(`/enquiries/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Enquiry updated successfully.');
      } else {
        await request('/enquiries', { method: 'POST', body: payload });
        setSuccess('Enquiry created successfully.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save enquiry');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (enquiry) => {
    setEditingId(enquiry._id);
    setForm({
      customer: enquiry.customer?._id || '',
      travelDate: enquiry.travelDate ? new Date(enquiry.travelDate).toISOString().slice(0, 10) : '',
      returnDate: enquiry.returnDate ? new Date(enquiry.returnDate).toISOString().slice(0, 10) : '',
      pickupLocation: enquiry.pickupLocation || '',
      dropLocation: enquiry.dropLocation || '',
      destination: enquiry.destination || '',
      numberOfPassengers: enquiry.numberOfPassengers || 1,
      vehiclePreference: enquiry.vehiclePreference || '',
      travelType: enquiry.travelType || 'Local Trip',
      specialRequirements: enquiry.specialRequirements || '',
      estimatedAmount: enquiry.estimatedAmount || '',
      notes: enquiry.notes || '',
      status: enquiry.status || 'New',
    });
  };

  const handleDelete = async (enquiryId) => {
    if (!window.confirm('Archive this enquiry?')) {
      return;
    }

    try {
      await request(`/enquiries/${enquiryId}`, { method: 'DELETE' });
      setSuccess('Enquiry archived successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to archive enquiry');
    }
  };

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Enquiry management</p>
            <h2>Enquiries</h2>
          </div>
          <div className="toolbar-actions">
            <input
              className="search-box"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, destination or pickup"
            />
            <button type="button" className="primary-button" onClick={() => resetForm()}>
              {editingId ? 'New enquiry' : '+ New Enquiry'}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="filter-row" style={{ marginTop: '18px' }}>
          <select className="filter-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>

          <select className="filter-control" value={travelTypeFilter} onChange={(event) => setTravelTypeFilter(event.target.value)}>
            {travelTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '18px' }}>
          <label>
            Customer
            <select name="customer" value={form.customer} onChange={handleChange} required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>{customer.name}</option>
              ))}
            </select>
          </label>

          <label>
            Travel Type
            <select name="travelType" value={form.travelType} onChange={handleChange}>
              {travelTypeOptions.filter((option) => option !== 'All').map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Travel Date
            <input type="date" name="travelDate" value={form.travelDate} onChange={handleChange} />
          </label>

          <label>
            Return Date
            <input type="date" name="returnDate" value={form.returnDate} onChange={handleChange} />
          </label>

          <label>
            Pickup Location
            <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="Pickup point" />
          </label>

          <label>
            Drop Location
            <input name="dropLocation" value={form.dropLocation} onChange={handleChange} placeholder="Drop point" />
          </label>

          <label>
            Destination
            <input name="destination" value={form.destination} onChange={handleChange} placeholder="Destination" />
          </label>

          <label>
            Number of Passengers
            <input type="number" min="1" name="numberOfPassengers" value={form.numberOfPassengers} onChange={handleChange} />
          </label>

          <label>
            Vehicle Preference
            <input name="vehiclePreference" value={form.vehiclePreference} onChange={handleChange} placeholder="Car / SUV / Jeep / Tempo" />
          </label>

          <label>
            Estimated Amount
            <input type="number" name="estimatedAmount" value={form.estimatedAmount} onChange={handleChange} placeholder="0" />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.filter((option) => option !== 'All').map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="full-width">
            Special Requirements
            <textarea name="specialRequirements" value={form.specialRequirements} onChange={handleChange} rows="3" placeholder="Special instructions or preferences" />
          </label>

          <label className="full-width">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Notes for the team" />
          </label>

          <div className="toolbar-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Create Enquiry')}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading">
          <h2>Enquiry list</h2>
          <p>Track active travel enquiries and their status.</p>
        </div>

        {loading ? (
          <div className="empty-card compact"><h3>Loading enquiries...</h3></div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="empty-card compact">
            <h3>No enquiries yet.</h3>
            <p>Create an enquiry to start managing customer requests.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Travel date</th>
                  <th>Destination</th>
                  <th>Passengers</th>
                  <th>Estimated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry._id}>
                    <td>{enquiry.customer?.name || 'Customer'}</td>
                    <td>{enquiry.travelDate ? new Date(enquiry.travelDate).toLocaleDateString() : '-'}</td>
                    <td>{enquiry.destination || '-'}</td>
                    <td>{enquiry.numberOfPassengers || 1}</td>
                    <td>{enquiry.estimatedAmount ? `₹${Number(enquiry.estimatedAmount).toLocaleString('en-IN')}` : '₹0'}</td>
                    <td><span className={`status-badge ${String(enquiry.status).toLowerCase().replace(/\s+/g, '-')}`}>{enquiry.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => handleEdit(enquiry)}>Edit</button>
                        <button type="button" className="icon-button" onClick={() => handleDelete(enquiry._id)}>Archive</button>
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

export default EnquiriesPage;
