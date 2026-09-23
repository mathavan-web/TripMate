import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const expenseCategories = ['Fuel', 'Toll', 'Parking', 'Food', 'Driver Allowance', 'Accommodation', 'Maintenance', 'Permit', 'Other'];
const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];
const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  trip: '',
  booking: '',
  category: 'Fuel',
  description: '',
  amount: '',
  expenseDate: today,
  paymentMethod: 'Cash',
  referenceNumber: '',
  notes: '',
};

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, tripsResponse] = await Promise.all([request('/expenses'), request('/trips')]);
      setExpenses(expensesResponse.data || []);
      setTrips(tripsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || [expense.expenseNumber, expense.description, expense.trip?.destination, expense.booking?.bookingNumber].some((value) => String(value || '').toLowerCase().includes(keyword));
    return matchesSearch && (categoryFilter === 'All' || expense.category === categoryFilter);
  }), [expenses, search, categoryFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleTripChange = (event) => {
    const trip = trips.find((item) => item._id === event.target.value);
    setForm((previous) => ({ ...previous, trip: event.target.value, booking: trip?.booking?._id || trip?.booking || '' }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm, expenseDate: today });
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
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await request(`/expenses/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Expense updated successfully.');
      } else {
        await request('/expenses', { method: 'POST', body: payload });
        setSuccess('Expense created successfully.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setForm({
      trip: expense.trip?._id || '',
      booking: expense.booking?._id || '',
      category: expense.category || 'Fuel',
      description: expense.description || '',
      amount: expense.amount || '',
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().slice(0, 10) : today,
      paymentMethod: expense.paymentMethod || 'Cash',
      referenceNumber: expense.referenceNumber || '',
      notes: expense.notes || '',
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await request(`/expenses/${expenseId}`, { method: 'DELETE' });
      setSuccess('Expense deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to delete expense');
    }
  };

  const selectedTrip = trips.find((trip) => trip._id === form.trip);

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div><p className="eyebrow">Expense management</p><h2>Expenses</h2></div>
          <div className="toolbar-actions">
            <input className="search-box" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expense or trip" />
            <button type="button" className="primary-button" onClick={resetForm}>{editingId ? 'New expense' : '+ Add Expense'}</button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <div className="filter-row" style={{ marginTop: '18px' }}><select className="filter-control" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="All">All categories</option>{expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '18px' }}>
          <label>Trip<select name="trip" value={form.trip} onChange={handleTripChange} required><option value="">Select trip</option>{trips.map((trip) => <option key={trip._id} value={trip._id}>{trip.booking?.bookingNumber || 'Trip'} - {trip.destination || 'Destination'}</option>)}</select></label>
          <label>Booking<input value={selectedTrip?.booking?.bookingNumber || (form.booking ? 'Linked booking' : 'Select a trip')} readOnly /></label>
          <label>Category<select name="category" value={form.category} onChange={handleChange}>{expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label>Amount<input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={handleChange} required /></label>
          <label>Expense Date<input type="date" name="expenseDate" value={form.expenseDate} onChange={handleChange} required /></label>
          <label>Payment Method<select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <label>Reference Number<input name="referenceNumber" value={form.referenceNumber} onChange={handleChange} /></label>
          <label>Description<input name="description" value={form.description} onChange={handleChange} /></label>
          <label className="full-width">Notes<textarea name="notes" value={form.notes} onChange={handleChange} rows="2" /></label>
          <div className="table-actions"><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Expense' : 'Save Expense'}</button>{editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}</div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading"><h2>Expense list</h2><p>Track trip costs by category and payment method.</p></div>
        {loading ? <div className="empty-card"><h3>Loading expenses...</h3></div> : filteredExpenses.length === 0 ? <div className="empty-card"><h3>No expenses yet.</h3><p>Expenses recorded against trips will appear here.</p></div> : (
          <div className="table-wrapper"><table className="data-table"><thead><tr><th>Expense</th><th>Trip</th><th>Booking</th><th>Category</th><th>Amount</th><th>Date</th><th>Method</th><th>Actions</th></tr></thead><tbody>
            {filteredExpenses.map((expense) => <tr key={expense._id}><td>{expense.expenseNumber}</td><td>{expense.trip?.destination || '-'}</td><td>{expense.booking?.bookingNumber || '-'}</td><td>{expense.category}</td><td>₹{Number(expense.amount || 0).toLocaleString('en-IN')}</td><td>{expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '-'}</td><td>{expense.paymentMethod}</td><td><div className="table-actions"><button type="button" className="text-button" onClick={() => handleEdit(expense)}>Edit</button><button type="button" className="secondary-button danger" onClick={() => handleDelete(expense._id)}>Delete</button></div></td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}

export default ExpensesPage;
