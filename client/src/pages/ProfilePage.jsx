import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import request from '../services/api';

function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await request('/auth/me', {
        method: 'PUT',
        body: { name: form.name, phone: form.phone },
      });
      setMessage('Profile updated successfully.');
      if (response.data) {
        setForm((prev) => ({ ...prev, name: response.data.name, phone: response.data.phone }));
      }
    } catch (err) {
      setMessage(err.message || 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="profile-header">
          <div className="avatar large">{user?.name?.[0] || 'U'}</div>
          <div>
            <h2>User Profile</h2>
            <p>Manage your TripMate account details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            Role
            <input name="role" value={form.role} disabled />
          </label>

          {message && <div className="alert success">{message}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="danger-panel">
          <button type="button" className="secondary-button danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
