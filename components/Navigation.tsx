'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import styles from './Navigation.module.css';

export default function Navigation() {
  const router = useRouter();
  const supabase = createClient();
  const [adminLink, setAdminLink] = useState({ href: '/admin/login', label: 'Admin Login' });
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const appStoreUrl = 'https://apps.apple.com/gb/app/omr-hub/id6755069825';

  useEffect(() => {
    setMounted(true);
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user is admin
          const { data: roleData } = await supabase
            .from('roles')
            .select('is_admin')
            .eq('user_id', user.id)
            .maybeSingle();

          if (roleData?.is_admin) {
            setAdminLink({ href: '/admin/users', label: 'Admin Portal' });
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdminClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (adminLink.href === '/admin/users') {
      e.preventDefault();
      router.push('/admin/users');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/#coaches', label: 'For Coaches' },
  ];

  return (
    <nav
      style={{
        background: '#000000',
        borderBottom: '1px solid rgba(84, 84, 88, 0.65)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: '#FFFFFF',
            fontSize: '20px',
            fontWeight: '700',
            letterSpacing: '0.37px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/omr-logo-inverted.png"
            alt=""
            style={{ display: 'block', height: 20, width: 'auto' }}
          />
          OMR‑HUB
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            {navLinks.map((link) => (
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

          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{ padding: '10px 14px', fontSize: 15 }}
          >
            Get the app
          </a>

          {mounted && (
            <Link
              href={adminLink.href}
              onClick={(e) => {
                setMobileOpen(false);
                handleAdminClick(e);
              }}
              style={{
                color: '#007AFF',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '600',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 122, 255, 0.3)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)';
                e.currentTarget.style.borderColor = '#007AFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.3)';
              }}
            >
              {adminLink.label}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              background: 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              fontSize: 15,
              lineHeight: '20px',
            }}
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div
          className={styles.mobileNav}
          style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 16px' }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: 'rgba(235, 235, 245, 0.78)',
                textDecoration: 'none',
                fontSize: '17px',
                lineHeight: '22px',
                letterSpacing: '-0.41px',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
