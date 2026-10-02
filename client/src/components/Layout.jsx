import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    id: 'sales',
    label: 'Sales',
    icon: '📋',
    items: [
      { label: 'Customers', path: '/customers' },
      { label: 'Enquiries', path: '/enquiries' },
      { label: 'Packages', path: '/packages' },
      { label: 'Quotations', path: '/quotations' },
      { label: 'Bookings', path: '/bookings' },
    ],
  },
  { id: 'operations', label: 'Operations', icon: '🚕', items: [{ label: 'Trips', path: '/trips' }] },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    items: [
      { label: 'Payments', path: '/payments' },
      { label: 'Expenses', path: '/expenses' },
      { label: 'Invoices', path: '/invoices' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: '👤',
    items: [
      { label: 'Business', path: '/business-profile' },
      { label: 'Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' },
    ],
  },
];

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeGroup = navGroups.find((group) => group.items.some((item) => item.path === location.pathname))?.id || null;
  const [expandedGroup, setExpandedGroup] = useState(activeGroup);

  useEffect(() => {
    setExpandedGroup(activeGroup);
  }, [activeGroup]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    const targetId = location.hash.slice(1);
    if (location.pathname === '/dashboard' && targetId) {
      const frameId = window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
      });
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const closeMenu = () => setMenuOpen(false);

  const dashboardLinkClass = (section) => (
    location.pathname === '/dashboard' && (section ? location.hash === `#${section}` : !location.hash)
      ? 'nav-item active'
      : 'nav-item'
  );

  const scrollToDashboardSection = (section) => {
    closeMenu();
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ block: 'start' });
    }, 0);
  };

  return (
    <div className="app-shell">
      {menuOpen && <button type="button" className="drawer-backdrop" aria-label="Close navigation" onClick={closeMenu} />}

      <aside id="app-navigation" className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation" aria-hidden={!menuOpen}>
        <div className="drawer-heading">
          <button type="button" className="menu-toggle close-menu" aria-label="Close navigation" onClick={closeMenu}>
            <span aria-hidden="true">×</span>
          </button>
          <div className="brand-block">
            <div className="brand-mark">T</div>
            <div>
              <div className="brand-name">TripMate</div>
              <small>Business Suite</small>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={() => dashboardLinkClass()} onClick={closeMenu}>
            <span aria-hidden="true">🏠</span> Dashboard
          </NavLink>
          <NavLink to="/dashboard#trip-calendar" className={() => dashboardLinkClass('trip-calendar')} onClick={() => scrollToDashboardSection('trip-calendar')}>
            <span aria-hidden="true">📅</span> Calendar
          </NavLink>

          {navGroups.map((group) => {
            const expanded = expandedGroup === group.id;
            return (
              <div className="nav-group" key={group.id}>
                <button
                  type="button"
                  className={`nav-group-toggle ${expanded ? 'expanded' : ''}`}
                  aria-expanded={expanded}
                  aria-controls={`nav-group-${group.id}`}
                  onClick={() => setExpandedGroup(expanded ? null : group.id)}
                >
                  <span><span aria-hidden="true">{group.icon}</span> {group.label}</span>
                  <span className="nav-chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
                </button>
                {expanded && (
                  <div id={`nav-group-${group.id}`} className="nav-subitems">
                    {group.items.map((item) => (
                      <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <NavLink to="/reviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMenu}>
            <span aria-hidden="true">⭐</span> Reviews
          </NavLink>
          <NavLink to="/dashboard#reports" className={() => dashboardLinkClass('reports')} onClick={() => scrollToDashboardSection('reports')}>
            <span aria-hidden="true">📊</span> Reports
          </NavLink>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              className="menu-toggle open-menu"
              aria-label="Open navigation"
              aria-controls="app-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div>
            <p className="eyebrow">Travel management</p>
            <h2>Welcome back</h2>
            </div>
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
