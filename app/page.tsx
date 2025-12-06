import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <img
            src="/omr-logo-inverted.png"
            alt="OMR Hub"
            style={{
              maxWidth: '200px',
              width: '100%',
              height: 'auto',
              marginBottom: '16px',
            }}
          />
        </div>

        <h1
          style={{
            fontSize: '48px',
            fontWeight: '700',
            lineHeight: '56px',
            letterSpacing: '0.37px',
            marginBottom: '16px',
            color: '#FFFFFF',
          }}
        >
          OMR Hub
        </h1>

        <p
          style={{
            fontSize: '22px',
            lineHeight: '28px',
            letterSpacing: '-0.41px',
            color: 'rgba(235, 235, 245, 0.6)',
            marginBottom: '16px',
            maxWidth: '600px',
            margin: '0 auto 24px',
          }}
        >
          Your hub for activities, events, and workouts. Stay connected and
          organised with everything you need in one place.
        </p>

        {/* Download Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <a
            href="https://apps.apple.com/gb/app/omr-hub/id6755069825"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-primary"
            style={{
              minWidth: '200px',
            }}
          >
            Download on the App Store
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: '32px 24px 16px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '34px',
            fontWeight: '700',
            lineHeight: '41px',
            letterSpacing: '0.37px',
            textAlign: 'center',
            marginBottom: '16px',
            color: '#FFFFFF',
          }}
        >
          Features
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Activities Feature */}
          <div className="card">
            <h3
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              Activities
            </h3>
            <p
              style={{
                fontSize: '17px',
                lineHeight: '22px',
                letterSpacing: '-0.41px',
                color: 'rgba(235, 235, 245, 0.6)',
                marginBottom: '0',
              }}
            >
              Track and manage your activities with ease. Keep everything
              organised and accessible whenever you need it.
            </p>
          </div>

          {/* Events Feature */}
          <div className="card">
            <h3
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              Events
            </h3>
            <p
              style={{
                fontSize: '17px',
                lineHeight: '22px',
                letterSpacing: '-0.41px',
                color: 'rgba(235, 235, 245, 0.6)',
                marginBottom: '0',
              }}
            >
              Never miss an important event. Stay up to date with all your
              scheduled events and get reminders when you need them.
            </p>
          </div>

          {/* Workouts Feature */}
          <div className="card">
            <h3
              style={{
                fontSize: '22px',
                fontWeight: '700',
                lineHeight: '28px',
                letterSpacing: '0.35px',
                marginBottom: '12px',
                color: '#FFFFFF',
              }}
            >
              Workouts
            </h3>
            <p
              style={{
                fontSize: '17px',
                lineHeight: '22px',
                letterSpacing: '-0.41px',
                color: 'rgba(235, 235, 245, 0.6)',
                marginBottom: '0',
              }}
            >
              Plan and track your workouts. Monitor your progress and achieve
              your fitness goals with comprehensive workout management.
            </p>
          </div>
        </div>
      </section>


    </div>
  );
}
