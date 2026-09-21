import { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const emptyForm = {
  name: '',
  description: '',
  packageType: 'Tour Package',
  duration: '',
  numberOfDays: 1,
  numberOfNights: 0,
  destinations: '',
  pickupLocation: '',
  dropLocation: '',
  vehicleType: '',
  maxPassengers: 1,
  basePrice: '',
  priceType: 'Per Trip',
  inclusions: '',
  exclusions: '',
  termsAndConditions: '',
  isActive: true,
};

const statusOptions = ['All', 'Active', 'Inactive'];
const packageTypeOptions = ['All', 'Tour Package', 'Local Sightseeing', 'Jeep Safari', 'Airport Transfer', 'Outstation', 'One Way', 'Round Trip', 'Custom'];

function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await request('/packages');
      setPackages(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? pkg.isActive : !pkg.isActive);
      const matchesType = typeFilter === 'All' || pkg.packageType === typeFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword || [pkg.name, pkg.packageType, pkg.vehicleType, pkg.duration, pkg.destinations?.join(' ')].some((value) => String(value || '').toLowerCase().includes(keyword));
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [packages, search, statusFilter, typeFilter]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
        numberOfDays: Number(form.numberOfDays || 1),
        numberOfNights: Number(form.numberOfNights || 0),
        maxPassengers: Number(form.maxPassengers || 1),
        basePrice: Number(form.basePrice || 0),
        destinations: (form.destinations || '').split(',').map((item) => item.trim()).filter(Boolean),
        inclusions: (form.inclusions || '').split(',').map((item) => item.trim()).filter(Boolean),
        exclusions: (form.exclusions || '').split(',').map((item) => item.trim()).filter(Boolean),
      };

      if (editingId) {
        await request(`/packages/${editingId}`, { method: 'PUT', body: payload });
        setSuccess('Package updated successfully.');
      } else {
        await request('/packages', { method: 'POST', body: payload });
        setSuccess('Package created successfully.');
      }

      resetForm();
      await loadPackages();
    } catch (err) {
      setError(err.message || 'Unable to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name || '',
      description: pkg.description || '',
      packageType: pkg.packageType || 'Tour Package',
      duration: pkg.duration || '',
      numberOfDays: pkg.numberOfDays || 1,
      numberOfNights: pkg.numberOfNights || 0,
      destinations: Array.isArray(pkg.destinations) ? pkg.destinations.join(', ') : '',
      pickupLocation: pkg.pickupLocation || '',
      dropLocation: pkg.dropLocation || '',
      vehicleType: pkg.vehicleType || '',
      maxPassengers: pkg.maxPassengers || 1,
      basePrice: pkg.basePrice || 0,
      priceType: pkg.priceType || 'Per Trip',
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join(', ') : '',
      exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions.join(', ') : '',
      termsAndConditions: pkg.termsAndConditions || '',
      isActive: pkg.isActive !== false,
    });
  };

  const togglePackageStatus = async (pkgId, currentStatus) => {
    try {
      await request(`/packages/${pkgId}/status`, { method: 'PATCH', body: { isActive: !currentStatus } });
      await loadPackages();
      setSuccess('Package status updated.');
    } catch (err) {
      setError(err.message || 'Unable to update package status');
    }
  };

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">Package management</p>
            <h2>Packages</h2>
          </div>
          <div className="toolbar-actions">
            <input
              className="search-box"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search packages"
            />
            <button type="button" className="primary-button" onClick={() => resetForm()}>
              {editingId ? 'New package' : '+ Add Package'}
            </button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="filter-row" style={{ marginTop: '18px' }}>
          <select className="filter-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>

          <select className="filter-control" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            {packageTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '20px' }}>
          <label>
            Package Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Package Type
            <select name="packageType" value={form.packageType} onChange={handleChange}>
              {packageTypeOptions.filter((option) => option !== 'All').map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="full-width">
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
          </label>

          <label>
            Duration
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="2 Days / 1 Night" />
          </label>

          <label>
            Number of Days
            <input type="number" min="1" name="numberOfDays" value={form.numberOfDays} onChange={handleChange} />
          </label>

          <label>
            Number of Nights
            <input type="number" min="0" name="numberOfNights" value={form.numberOfNights} onChange={handleChange} />
          </label>

          <label>
            Destinations
            <input name="destinations" value={form.destinations} onChange={handleChange} placeholder="Munnar, Mattupetty, Top Station" />
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
            Vehicle Type
            <input name="vehicleType" value={form.vehicleType} onChange={handleChange} placeholder="SUV / Jeep / Sedan" />
          </label>

          <label>
            Max Passengers
            <input type="number" min="1" name="maxPassengers" value={form.maxPassengers} onChange={handleChange} />
          </label>

          <label>
            Base Price
            <input type="number" min="0" name="basePrice" value={form.basePrice} onChange={handleChange} />
          </label>

          <label>
            Price Type
            <select name="priceType" value={form.priceType} onChange={handleChange}>
              <option value="Per Trip">Per Trip</option>
              <option value="Per Person">Per Person</option>
              <option value="Per Day">Per Day</option>
            </select>
          </label>

          <label className="full-width">
            Inclusions
            <input name="inclusions" value={form.inclusions} onChange={handleChange} placeholder="Vehicle, Driver, Fuel, Parking" />
          </label>

          <label className="full-width">
            Exclusions
            <input name="exclusions" value={form.exclusions} onChange={handleChange} placeholder="Food, Tickets, Hotel" />
          </label>

          <label className="full-width">
            Terms & Conditions
            <textarea name="termsAndConditions" value={form.termsAndConditions} onChange={handleChange} rows="3" />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Active
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
          </label>

          <div className="toolbar-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Save Package')}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      </div>

      <div className="card-block">
        <div className="section-heading">
          <h2>Package list</h2>
          <p>Reusable travel offerings for quotation creation.</p>
        </div>

        {loading ? (
          <div className="empty-card compact"><h3>Loading packages...</h3></div>
        ) : filteredPackages.length === 0 ? (
          <div className="empty-card compact">
            <h3>No packages yet.</h3>
            <p>Create your first travel package to start building quotations.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Vehicle</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td>{pkg.name}</td>
                    <td>{pkg.packageType}</td>
                    <td>{pkg.duration || '-'}</td>
                    <td>{pkg.vehicleType || '-'}</td>
                    <td>₹{Number(pkg.basePrice || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`status-badge ${pkg.isActive ? 'accepted' : 'draft'}`}>{pkg.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => handleEdit(pkg)}>Edit</button>
                        <button type="button" className="text-button" onClick={() => togglePackageStatus(pkg._id, pkg.isActive)}>{pkg.isActive ? 'Deactivate' : 'Activate'}</button>
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

export default PackagesPage;
