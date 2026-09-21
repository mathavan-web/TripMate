import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const emptyForm = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  notes: '',
};

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const keyword = search.toLowerCase();
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.whatsapp, customer.email, customer.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [customers, search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await request('/customers');
      setCustomers(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
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
      if (editingId) {
        await request(`/customers/${editingId}`, { method: 'PUT', body: form });
        setSuccess('Customer updated successfully.');
      } else {
        await request('/customers', { method: 'POST', body: form });
        setSuccess('Customer added successfully.');
      }

      resetForm();
      await loadCustomers();
    } catch (err) {
      setError(err.message || 'Unable to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer._id);
    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pinCode: customer.pinCode || '',
      notes: customer.notes || '',
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Archive this customer? This removes them from the active list without deleting related history.')) {
      return;
    }

    try {
      await request(`/customers/${customerId}`, { method: 'DELETE' });
      setSuccess('Customer archived successfully.');
      await loadCustomers();
    } catch (err) {
      setError(err.message || 'Unable to archive customer');
    }
  };

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Customer management</p>
            <h2>Customers</h2>
          </div>
          <div className="toolbar-actions">
            <input
              className="search-box"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, email or city"
            />
            <button type="button" className="primary-button" onClick={() => resetForm()}>
              {editingId ? 'New customer' : '+ Add Customer'}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '20px' }}>
          <label>
            Customer Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Customer name" required />
          </label>

          <label>
            Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" required />
          </label>

          <label>
            WhatsApp
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp number" />
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
          </label>

          <label className="full-width">
            Address
            <input name="address" value={form.address} onChange={handleChange} placeholder="Street address" />
          </label>

          <label>
            City
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
          </label>

          <label>
            State
            <input name="state" value={form.state} onChange={handleChange} placeholder="State" />
          </label>

          <label>
            PIN Code
            <input name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="PIN code" />
          </label>

          <label className="full-width">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Notes or requirements" />
          </label>

          <div className="toolbar-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Save Customer')}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading">
          <h2>Customer list</h2>
          <p>View and manage active customer records.</p>
        </div>

        {loading ? (
          <div className="empty-card compact"><h3>Loading customers...</h3></div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-card compact">
            <h3>No customers yet.</h3>
            <p>Start by adding your first customer.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>WhatsApp</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Enquiries</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.whatsapp || '-'}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.city || '-'}</td>
                    <td>{customer.enquiryCount || 0}</td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => handleEdit(customer)}>Edit</button>
                        <button type="button" className="icon-button" onClick={() => handleDelete(customer._id)}>Archive</button>
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

export default CustomersPage;
