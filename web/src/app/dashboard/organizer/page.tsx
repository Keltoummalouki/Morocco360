const STATS = [
  { label: 'My Experiences', value: '14',    delta: '+2 this month'   },
  { label: 'Total Views',    value: '9.3K',  delta: '+18% vs last'    },
  { label: 'Bookings',       value: '87',    delta: 'This month'      },
  { label: 'Avg. Rating',    value: '4.8',   delta: 'Out of 5.0'      },
];

const EXPERIENCES = [
  { title: 'Marrakech Medina at Dusk',  views: '2 104', status: 'Published', updated: '2 days ago'   },
  { title: 'Fez Tanneries Panorama',    views: '1 867', status: 'Published', updated: '1 week ago'   },
  { title: 'Sahara Sunrise 360°',       views: '3 291', status: 'Published', updated: '3 days ago'   },
  { title: 'Blue City Chefchaouen',     views: '988',   status: 'Draft',     updated: 'Just now'     },
  { title: 'Atlas Mountain Pass',       views: '–',     status: 'Review',    updated: '5 hours ago'  },
];

const STATUS_COLOR: Record<string, string> = {
  Published: '#4A7C6F',
  Draft:     '#B8862D',
  Review:    '#6B7280',
};

export default function OrganizerDashboard() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: '#B8862D',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Organizer Panel
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          My Experiences
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Manage your panoramas, track views, and handle bookings.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ gap: '1px', background: 'var(--border)', marginBottom: '40px' }}
      >
        {STATS.map((s) => (
          <div key={s.label} style={{ background: 'var(--background)', padding: '28px 24px' }}>
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

      {/* Experiences table + Upload CTA */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '24px' }}>

        <div className="md:col-span-2" style={{ border: '1px solid var(--border)' }}>
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
              My panoramas
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#B8862D', cursor: 'pointer' }}>
              + Upload new
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Title', 'Views', 'Status', 'Updated'].map((col) => (
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
              {EXPERIENCES.map((exp) => (
                <tr key={exp.title} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{exp.title}</p>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {exp.views}
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: STATUS_COLOR[exp.status] ?? 'var(--muted)',
                      }}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    {exp.updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '1px solid var(--border)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
              Upcoming sessions
            </h3>
            {[
              { title: 'Fez Live Tour',      date: 'Mar 10, 14:00' },
              { title: 'Sahara Night Sky',   date: 'Mar 14, 20:00' },
              { title: 'Essaouira Coastal',  date: 'Mar 19, 10:00' },
            ].map((session) => (
              <div
                key={session.title}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{session.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{session.date}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)',
              padding: '28px 24px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '10px' }}>
              Upload a new panorama
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#A8A29E', marginBottom: '20px', lineHeight: 1.7 }}>
              Share your 360° captures with thousands of explorers.
            </p>
            <button
              className="btn-primary"
              style={{ background: '#B8862D', display: 'block', width: '100%', textAlign: 'center' }}
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
