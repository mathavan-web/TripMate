import { Link } from 'react-router-dom';

const settingsSections = [
  { title: 'Profile', description: 'Manage your account details.', path: '/profile' },
  { title: 'Business Information', description: 'Update your business profile.', path: '/business-profile' },
  { title: 'Account', description: 'Review account details and access.', path: '/profile' },
];

function SettingsPage() {
  return (
    <div className="page-shell">
      <div className="card-block">
        <div className="section-heading">
          <h2>Settings</h2>
          <p>Manage your personal and business preferences.</p>
        </div>

        <div className="settings-list">
          {settingsSections.map((section) => (
            <Link key={section.title} className="setting-item" to={section.path}>
              <div>
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </div>
              <span>→</span>
            </Link>
          ))}

          <div className="setting-item danger-box">
            <div>
              <strong>Logout</strong>
              <small>Sign out of TripMate securely.</small>
            </div>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
