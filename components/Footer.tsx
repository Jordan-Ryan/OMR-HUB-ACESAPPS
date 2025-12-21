'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  const footerLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/support', label: 'Support' },
  ];

  return (
    <footer
      style={{
        background: '#1C1C1E',
        borderTop: '1px solid rgba(84, 84, 88, 0.65)',
        padding: '24px 24px',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Links */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'center',
            }}
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: 'rgba(235, 235, 245, 0.6)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  lineHeight: '20px',
                  letterSpacing: '-0.24px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(235, 235, 245, 0.6)';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p
            style={{
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '13px',
              lineHeight: '18px',
              margin: 0,
            }}
          >
            © {year} OMR‑HUB. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}
