import { cookies } from 'next/headers';

const FEATURED = [
  { title: 'Marrakech Medina at Dusk',   city: 'Marrakech',   duration: '8 min', views: '2.1K' },
  { title: 'Blue Streets of Chefchaouen',city: 'Chefchaouen', duration: '5 min', views: '1.4K' },
  { title: 'Sahara Sunrise 360°',        city: 'Sahara',      duration: '12 min',views: '3.3K' },
  { title: 'Hassan II Mosque Interior',  city: 'Casablanca',  duration: '6 min', views: '987'  },
];

const RECENT = [
  { title: 'Fez Tanneries Panorama',  city: 'Fez',         time: '2 hours ago'  },
  { title: 'Essaouira Ramparts',       city: 'Essaouira',   time: 'Yesterday'    },
  { title: 'Atlas Mountain Pass',      city: 'Atlas',       time: '3 days ago'   },
];

export default async function UserDashboard() {
  const cookieStore = await cookies();
  const rawName = cookieStore.get('x-name')?.value ?? 'Explorer';
  const name = decodeURIComponent(rawName).split(' ')[0];

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: '#4A7C6F',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Welcome back
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          {name}, explore Morocco
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Pick up where you left off or discover something new.
        </p>
      </div>

      {/* Quick stats strip */}
      <div
        className="grid grid-cols-3"
        style={{
          gap: '1px',
          background: 'var(--border)',
          marginBottom: '40px',
          border: '1px solid var(--border)',
        }}
      >
        {[
          { label: 'Panoramas Viewed', value: '38'  },
          { label: 'Saved',            value: '12'  },
          { label: 'Cities Explored',  value: '7'   },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--background)', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>
              {s.value}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Featured experiences */}
      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.375rem', fontWeight: 600 }}>
            Featured panoramas
          </h2>
          <span style={{ fontSize: '0.8125rem', color: '#4A7C6F', cursor: 'pointer' }}>
            Browse all
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
          {FEATURED.map((exp, i) => (
            <div
              key={exp.title}
              className="card-hover"
              style={{
                border: '1px solid var(--border)',
                padding: '28px 24px',
                background: i === 0 ? 'var(--foreground)' : 'var(--background)',
                color: i === 0 ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: i === 0 ? '#A8A29E' : 'var(--muted)',
                  }}
                >
                  {exp.city}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    letterSpacing: '0.1em',
                    color: i === 0 ? '#4A7C6F' : '#4A7C6F',
                    background: 'rgba(74,124,111,0.12)',
                    padding: '3px 8px',
                  }}
                >
                  360°
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '16px',
                  lineHeight: 1.3,
                }}
              >
                {exp.title}
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '0.8125rem', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                  {exp.duration}
                </span>
                <span style={{ fontSize: '0.8125rem', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                  {exp.views} views
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently viewed */}
      <div style={{ border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
            Recently viewed
          </h2>
        </div>
        {RECENT.map((item) => (
          <div
            key={item.title}
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '2px' }}>{item.title}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{item.city}</p>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
