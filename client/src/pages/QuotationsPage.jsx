import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const defaultForm = {
  customer: '',
  enquiry: '',
  package: '',
  travelDate: '',
  returnDate: '',
  pickupLocation: '',
  dropLocation: '',
  destination: '',
  passengers: 1,
  vehicleType: '',
  validUntil: '',
  discount: 0,
  tax: 0,
  advanceAmount: 0,
  termsAndConditions: '',
  notes: '',
  status: 'Draft',
  items: [{ description: '', quantity: 1, unitPrice: 0 }],
};

const statusOptions = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Cancelled'];

function QuotationsPage() {
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [packages, setPackages] = useState([]);
  const [quotations, setQuotations] = useState([]);
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
      const [customersRes, enquiriesRes, packagesRes, quotationsRes] = await Promise.all([
        request('/customers'),
        request('/enquiries'),
        request('/packages'),
        request('/quotations'),
      ]);

      setCustomers(customersRes.data || []);
      setEnquiries(enquiriesRes.data || []);
      setPackages((packagesRes.data || []).filter((pkg) => pkg.isActive));
      setQuotations(quotationsRes.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      const matchesStatus = statusFilter === 'All' || quote.status === statusFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword || [
        quote.quotationNumber,
        quote.customer?.name,
        quote.customer?.phone,
        quote.package?.name,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [quotations, search, statusFilter]);

  const subtotal = (form.items || []).reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const totalAmount = Math.max(0, subtotal - Number(form.discount || 0) + Number(form.tax || 0));
  const balanceAmount = Math.max(0, totalAmount - Number(form.advanceAmount || 0));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const nextItems = [...(prev.items || [])];
      nextItems[index] = { ...nextItems[index], [field]: value };
      nextItems[index].total = Number(nextItems[index].quantity || 0) * Number(nextItems[index].unitPrice || 0);
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...(prev.items || []), { description: '', quantity: 1, unitPrice: 0 }] }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({ ...prev, items: (prev.items || []).filter((_, itemIndex) => itemIndex !== index) }));
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
        passengers: Number(form.passengers || 1),
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        advanceAmount: Number(form.advanceAmount || 0),
        items: (form.items || []).map((item) => ({
          description: item.description || 'Item',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
        })),
      };

      if (editingId) {
        await request(`/quotations/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Quotation updated successfully.');
      } else {
        await request('/quotations', { method: 'POST', body: payload });
        setSuccess('Quotation created successfully.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (quote) => {
    setEditingId(quote._id);
    setForm({
      customer: quote.customer?._id || '',
      enquiry: quote.enquiry?._id || '',
      package: quote.package?._id || '',
      travelDate: quote.travelDate ? new Date(quote.travelDate).toISOString().slice(0, 10) : '',
      returnDate: quote.returnDate ? new Date(quote.returnDate).toISOString().slice(0, 10) : '',
      pickupLocation: quote.pickupLocation || '',
      dropLocation: quote.dropLocation || '',
      destination: quote.destination || '',
      passengers: quote.passengers || 1,
      vehicleType: quote.vehicleType || '',
      validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().slice(0, 10) : '',
      discount: quote.discount || 0,
      tax: quote.tax || 0,
      advanceAmount: quote.advanceAmount || 0,
      termsAndConditions: quote.termsAndConditions || '',
      notes: quote.notes || '',
      status: quote.status || 'Draft',
      items: quote.items && quote.items.length ? quote.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })) : [{ description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleStatusUpdate = async (quoteId, status) => {
    try {
      await request(`/quotations/${quoteId}/status`, { method: 'PATCH', body: { status } });
      await loadData();
      setSuccess('Quotation status updated.');
    } catch (err) {
      setError(err.message || 'Unable to update quotation status');
    }
  };

  const selectedPackage = packages.find((pkg) => pkg._id === form.package);

  useEffect(() => {
    if (selectedPackage) {
      setForm((prev) => ({
        ...prev,
        vehicleType: prev.vehicleType || selectedPackage.vehicleType || '',
        pickupLocation: prev.pickupLocation || selectedPackage.pickupLocation || '',
        dropLocation: prev.dropLocation || selectedPackage.dropLocation || '',
        destination: prev.destination || selectedPackage.destinations?.[0] || '',
        termsAndConditions: prev.termsAndConditions || selectedPackage.termsAndConditions || '',
      }));
    }
  }, [selectedPackage]);

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Quotation management</p>
            <h2>Quotations</h2>
          </div>
          <div className="toolbar-actions">
            <input
              className="search-box"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search quotation or customer"
            />
            <button type="button" className="primary-button" onClick={() => resetForm()}>
              {editingId ? 'New quotation' : '+ New Quotation'}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="filter-row" style={{ marginTop: '18px' }}>
          <select className="filter-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
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
            Enquiry
            <select name="enquiry" value={form.enquiry} onChange={handleChange}>
              <option value="">Optional enquiry</option>
              {enquiries.map((enquiry) => <option key={enquiry._id} value={enquiry._id}>{enquiry.destination || 'Enquiry'}</option>)}
            </select>
          </label>

          <label>
            Package
            <select name="package" value={form.package} onChange={handleChange}>
              <option value="">Select active package</option>
              {packages.map((pkg) => <option key={pkg._id} value={pkg._id}>{pkg.name}</option>)}
            </select>
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.filter((option) => option !== 'All').map((option) => <option key={option} value={option}>{option}</option>)}
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
            <input type="number" min="1" name="passengers" value={form.passengers} onChange={handleChange} />
          </label>

          <label>
            Vehicle Type
            <input name="vehicleType" value={form.vehicleType} onChange={handleChange} />
          </label>

          <label>
            Valid Until
            <input type="date" name="validUntil" value={form.validUntil} onChange={handleChange} />
          </label>

          <label>
            Discount
            <input type="number" min="0" name="discount" value={form.discount} onChange={handleChange} />
          </label>

          <label>
            Tax
            <input type="number" min="0" name="tax" value={form.tax} onChange={handleChange} />
          </label>

          <label>
            Advance Amount
            <input type="number" min="0" name="advanceAmount" value={form.advanceAmount} onChange={handleChange} />
          </label>

          <label className="full-width">
            Terms & Conditions
            <textarea name="termsAndConditions" value={form.termsAndConditions} onChange={handleChange} rows="3" />
          </label>

          <label className="full-width">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
          </label>

          <div className="full-width">
            <div className="section-heading">
              <h3>Quotation items</h3>
            </div>
            <div className="quotation-items">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.items || []).map((item, index) => (
                    <tr key={`${index}-${item.description}`}>
                      <td><input value={item.description} onChange={(event) => handleItemChange(index, 'description', event.target.value)} /></td>
                      <td><input type="number" min="1" value={item.quantity} onChange={(event) => handleItemChange(index, 'quantity', event.target.value)} /></td>
                      <td><input type="number" min="0" value={item.unitPrice} onChange={(event) => handleItemChange(index, 'unitPrice', event.target.value)} /></td>
                      <td>₹{Number((Number(item.quantity || 0) * Number(item.unitPrice || 0))).toLocaleString('en-IN')}</td>
                      <td><button type="button" className="icon-button" onClick={() => removeItem(index)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="secondary-button" style={{ marginTop: '12px' }} onClick={addItem}>+ Add Item</button>
          </div>

          <div className="quote-total-box full-width">
            <div className="total-row"><span>Subtotal</span><strong>₹{Number(subtotal).toLocaleString('en-IN')}</strong></div>
            <div className="total-row"><span>Discount</span><strong>-₹{Number(form.discount || 0).toLocaleString('en-IN')}</strong></div>
            <div className="total-row"><span>Tax</span><strong>₹{Number(form.tax || 0).toLocaleString('en-IN')}</strong></div>
            <div className="total-row grand-total"><span>Grand Total</span><strong>₹{Number(totalAmount).toLocaleString('en-IN')}</strong></div>
            <div className="total-row"><span>Advance</span><strong>₹{Number(form.advanceAmount || 0).toLocaleString('en-IN')}</strong></div>
            <div className="total-row"><span>Balance</span><strong>₹{Number(balanceAmount).toLocaleString('en-IN')}</strong></div>
          </div>

          <div className="toolbar-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Quotation' : 'Create Quotation')}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading">
          <h2>Quotation list</h2>
          <p>Current quotations with package, status, and financial summary.</p>
        </div>

        {loading ? (
          <div className="empty-card compact"><h3>Loading quotations...</h3></div>
        ) : filteredQuotations.length === 0 ? (
          <div className="empty-card compact">
            <h3>No quotations yet.</h3>
            <p>Create a quotation from an enquiry or customer request.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Travel Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => (
                  <tr key={quote._id}>
                    <td>{quote.quotationNumber}</td>
                    <td>{quote.customer?.name || '-'}</td>
                    <td>{quote.package?.name || '-'}</td>
                    <td>{quote.travelDate ? new Date(quote.travelDate).toLocaleDateString() : '-'}</td>
                    <td>₹{Number(quote.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`status-badge ${String(quote.status).toLowerCase()}`}>{quote.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => handleEdit(quote)}>Edit</button>
                        <button type="button" className="text-button" onClick={() => handleStatusUpdate(quote._id, 'Sent')}>Send</button>
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

export default QuotationsPage;
