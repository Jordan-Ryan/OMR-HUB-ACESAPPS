import Link from 'next/link';

export const metadata = {
  title: 'Support - OMR Hub',
  description: 'Get help and support for OMR Hub',
};

export default function SupportPage() {
  return (
    <div
      style={{
        padding: '24px 24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <div className="card">
        <h1
          style={{
            fontSize: '34px',
            fontWeight: '700',
            lineHeight: '41px',
            letterSpacing: '0.37px',
            marginBottom: '16px',
            color: '#FFFFFF',
          }}
        >
          Support
        </h1>

        {/* Contact Section */}
        <section style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              lineHeight: '28px',
              letterSpacing: '0.35px',
              marginBottom: '16px',
              color: '#FFFFFF',
            }}
          >
            Contact Us
          </h2>
          <p
            style={{
              fontSize: '17px',
              lineHeight: '22px',
              letterSpacing: '-0.41px',
              color: 'rgba(235, 235, 245, 0.6)',
              marginBottom: '16px',
            }}
          >
            Need help? We're here for you. Reach out to our support team and
            we'll get back to you as soon as possible.
          </p>
          <p
            style={{
              fontSize: '17px',
              lineHeight: '22px',
              letterSpacing: '-0.41px',
              color: 'rgba(235, 235, 245, 0.6)',
              marginBottom: '16px',
            }}
          >
            Email:{' '}
            <a
              href="mailto:OMRHub@acesapps.com"
              style={{ color: '#007AFF' }}
            >
              OMRHub@acesapps.com
            </a>
          </p>
          <a
            href="mailto:OMRHub@acesapps.com"
            className="button button-primary"
            style={{ display: 'inline-block' }}
          >
            Send Email
          </a>
        </section>

        {/* FAQ Section */}
        <section style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              lineHeight: '28px',
              letterSpacing: '0.35px',
              marginBottom: '16px',
              color: '#FFFFFF',
            }}
          >
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card-secondary">
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                How do I get started with OMR Hub?
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  margin: 0,
                }}
              >
                Download OMR Hub from the App Store and create an account. Once
                you're signed in, you can start creating activities, events, and
                workouts straight away.
              </p>
            </div>

            <div className="card-secondary">
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                How do I sync my data across devices?
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  margin: 0,
                }}
              >
                Your data is automatically synced when you sign in with the same
                account on multiple devices. Make sure you're connected to the
                internet for the sync to complete.
              </p>
            </div>

            <div className="card-secondary">
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                What should I do if the app crashes?
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  margin: 0,
                }}
              >
                Try closing and reopening the app. If the problem persists, make
                sure you're running the latest version of the app and your device's
                operating system is up to date. If issues continue, please contact
                our support team.
              </p>
            </div>

            <div className="card-secondary">
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                How do I delete my account?
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  margin: 0,
                }}
              >
                Go to your profile, scroll down and click delete account. This action is permanent and cannot be undone. All your data will be permanently deleted.
              </p>
            </div>

            <div className="card-secondary">
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                Is my data secure?
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  margin: 0,
                }}
              >
                Yes, we take data security seriously. Your data is encrypted and
                stored securely. For more information about how we protect your
                data, please see our{' '}
                <Link href="/privacy" style={{ color: '#007AFF' }}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              lineHeight: '28px',
              letterSpacing: '0.35px',
              marginBottom: '16px',
              color: '#FFFFFF',
            }}
          >
            Troubleshooting Tips
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                App won't load or is slow
              </h3>
              <ul
                style={{
                  paddingLeft: '24px',
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  listStyle: 'disc',
                }}
              >
                <li>Check your internet connection</li>
                <li>Close and restart the app</li>
                <li>Update to the latest version</li>
                <li>Restart your device</li>
              </ul>
            </div>

            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  lineHeight: '22px',
                  marginBottom: '8px',
                  color: '#FFFFFF',
                }}
              >
                Can't sign in
              </h3>
              <ul
                style={{
                  paddingLeft: '24px',
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  color: 'rgba(235, 235, 245, 0.6)',
                  listStyle: 'disc',
                }}
              >
                <li>Verify your email and password</li>
                <li>Try resetting your password</li>
                <li>Check your internet connection</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
