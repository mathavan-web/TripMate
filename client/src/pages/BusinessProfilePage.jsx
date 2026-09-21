import { useEffect, useState } from 'react';
import request from '../services/api';

const initialState = {
  businessName: '',
  ownerName: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  logo: '',
  upiId: '',
  paymentInformation: '',
  termsAndConditions: '',
};

function BusinessProfilePage() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await request('/business/profile');
        setForm((prev) => ({ ...prev, ...response.data }));
      } catch (err) {
        setError(err.message || 'Unable to load business profile');
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await request('/business/profile', {
        method: 'PUT',
        body: form,
      });
      setForm((prev) => ({ ...prev, ...response.data }));
      setSuccess('Business profile saved successfully.');
    } catch (err) {
      setError(err.message || 'Unable to save business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="section-heading">
          <h2>Business Profile</h2>
          <p>Keep your details ready for future quotations and invoices.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="section-title">Business Information</div>
          <label>
            Business Name
            <input name="businessName" value={form.businessName} onChange={handleChange} />
          </label>
          <label>
            Owner Name
            <input name="ownerName" value={form.ownerName} onChange={handleChange} />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            WhatsApp Number
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>

          <div className="section-title">Business Address</div>
          <label className="full-width">
            Address
            <textarea name="address" value={form.address} onChange={handleChange} rows="3" />
          </label>
          <label>
            City
            <input name="city" value={form.city} onChange={handleChange} />
          </label>
          <label>
            State
            <input name="state" value={form.state} onChange={handleChange} />
          </label>
          <label>
            PIN Code
            <input name="pinCode" value={form.pinCode} onChange={handleChange} />
          </label>

          <div className="section-title">Branding</div>
          <label className="full-width">
            Business Logo
            <input name="logo" value={form.logo} onChange={handleChange} placeholder="Logo URL or file reference" />
          </label>

          <div className="section-title">Payment Information</div>
          <label>
            UPI ID
            <input name="upiId" value={form.upiId} onChange={handleChange} />
          </label>
          <label className="full-width">
            Payment Information
            <textarea name="paymentInformation" value={form.paymentInformation} onChange={handleChange} rows="3" />
          </label>

          <div className="section-title">Terms &amp; Conditions</div>
          <label className="full-width">
            Terms and Conditions
            <textarea name="termsAndConditions" value={form.termsAndConditions} onChange={handleChange} rows="4" />
          </label>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Business Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BusinessProfilePage;
