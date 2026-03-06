const STATS = [
  { label: 'Total Users',        value: '1,284', delta: '+12 this week'  },
  { label: 'Active Panoramas',   value: '240',   delta: '+8 this month'  },
  { label: 'Monthly Views',      value: '48.6K', delta: '+22% vs last'   },
  { label: 'Open Reports',       value: '3',     delta: 'Needs review'   },
];

const RECENT_USERS = [
  { name: 'Youssef Alami',  email: 'y.alami@mail.ma',    role: 'USER',      status: 'Active'   },
  { name: 'Fatima Zahra',   email: 'fz@morocco.org',     role: 'ORGANIZER', status: 'Active'   },
  { name: 'Karim Benali',   email: 'k.benali@gmail.com', role: 'USER',      status: 'Pending'  },
  { name: 'Sara Ouhassou',  email: 's.ouhassou@ma.ma',   role: 'ORGANIZER', status: 'Active'   },
  { name: 'Omar Tazi',      email: 'omar.tazi@web.ma',   role: 'USER',      status: 'Suspended'},
];

const ROLE_COLOR: Record<string, string> = {
  ADMIN:     '#C2533A',
  ORGANIZER: '#B8862D',
  USER:      '#4A7C6F',
};

const STATUS_COLOR: Record<string, string> = {
  Active:    '#4A7C6F',
  Pending:   '#B8862D',
  Suspended: '#C2533A',
};

export default function AdminDashboard() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: 'var(--primary)',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Admin Panel
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Platform Overview
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Full access — manage users, content, and system settings.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ gap: '1px', background: 'var(--border)', marginBottom: '40px' }}
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            style={{ background: 'var(--background)', padding: '28px 24px' }}
          >
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {s.label}
            </p>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, marginBottom: '4px' }}>
              {s.value}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '24px' }}>

        {/* Recent users table */}
        <div
          className="md:col-span-2"
          style={{ border: '1px solid var(--border)' }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
              Recent users
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary)', cursor: 'pointer' }}>
              View all
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Role', 'Status'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '10px 24px',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_USERS.map((u) => (
                <tr
                  key={u.email}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>{u.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</p>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: ROLE_COLOR[u.role] ?? 'var(--muted)',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: STATUS_COLOR[u.status] ?? 'var(--muted)',
                        fontWeight: 500,
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick actions */}
        <div style={{ border: '1px solid var(--border)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
              Quick actions
            </h2>
          </div>
          <div style={{ padding: '16px' }}>
            {[
              { label: 'Manage Users',     desc: 'Edit roles & permissions' },
              { label: 'Review Content',   desc: '3 items awaiting approval' },
              { label: 'System Settings',  desc: 'Configuration & security'  },
              { label: 'Export Report',    desc: 'Download monthly CSV'       },
            ].map((action) => (
              <button
                key={action.label}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                }}
              >
                <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>{action.label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
