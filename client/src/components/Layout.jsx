import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Customers', path: '/customers' },
  { label: 'Enquiries', path: '/enquiries' },
  { label: 'Packages', path: '/packages' },
  { label: 'Quotations', path: '/quotations' },
  { label: 'Business', path: '/business-profile' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
];

function Layout() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">TripMate</div>
            <small>Business Suite</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Travel management</p>
            <h2>Welcome back</h2>
          </div>
          <div className="user-chip">
            <div className="avatar">{user?.name?.[0] || 'U'}</div>
            <div>
              <strong>{user?.name || 'User'}</strong>
              <small>{user?.role || 'Driver'}</small>
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
