'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AdminNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/challenges', label: 'Challenges' },
    { href: '/admin/coach/schedule', label: 'PT Schedule' },
    { href: '/admin/coach/workouts', label: 'Workouts' },
    { href: '/admin/coach/exercises', label: 'Exercises' },
  ];

  return (
    <nav
      style={{
        background: '#141414',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Link
            href="/admin/users"
            style={{
              textDecoration: 'none',
              color: '#FFFFFF',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: '700',
                letterSpacing: '0.37px',
                color: '#FFFFFF',
              }}
            >
              OMR Hub Admin
            </span>
          </Link>

          <div style={{ display: 'flex', gap: '4px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color:
                    pathname === link.href
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.6)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: pathname === link.href ? '600' : '500',
                  lineHeight: '22px',
                  letterSpacing: '-0.2px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background:
                    pathname === link.href
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'transparent',
                  border: pathname === link.href ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== link.href) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== link.href) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

