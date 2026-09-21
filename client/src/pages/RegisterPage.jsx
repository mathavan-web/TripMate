import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  role: 'Driver',
};

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(form);
      setSuccess('Registration successful. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setError(err.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card wide">
        <div className="auth-header">
          <div className="brand-mark large">T</div>
          <h1>Create your TripMate account</h1>
          <p>Set up your business profile and start managing your operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form grid-form">
          <label>
            Full name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
          </label>

          <label>
            Email address
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@example.com" />
          </label>

          <label>
            Phone number
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="Driver">Driver</option>
              <option value="Vehicle Owner">Vehicle Owner</option>
              <option value="Admin">Admin</option>
            </select>
          </label>

          <label>
            Business name
            <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Your business name" />
          </label>

          <label>
            Password
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label>
            Confirm password
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
            />
          </label>

          <div className="password-rules">
            Password must be at least 6 characters long.
          </div>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
