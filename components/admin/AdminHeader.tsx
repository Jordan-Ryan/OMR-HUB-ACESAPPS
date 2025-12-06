'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BellIcon, SearchIcon, SettingsIcon } from '@/components/icons/AdminIcons';

interface AdminHeaderProps {
  title?: string;
  actionButton?: React.ReactNode;
  mainSidebarWidth?: string;
  secondarySidebarWidth?: string;
  hideTitle?: boolean;
}

export default function AdminHeader({ 
  title, 
  actionButton,
  mainSidebarWidth = '280px',
  secondarySidebarWidth = '0px',
  hideTitle = false,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState(0); // TODO: Fetch actual notifications

  // Generate page title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    if (pathname === '/admin/users' || pathname?.startsWith('/admin/users/')) {
      return 'Users';
    }
    if (pathname === '/admin/coach/workouts' || pathname?.startsWith('/admin/coach/workouts/')) {
      return 'Workouts';
    }
    if (pathname === '/admin/coach/exercises' || pathname?.startsWith('/admin/coach/exercises/')) {
      return 'Exercises';
    }
    if (pathname === '/admin/coach/schedule' || pathname?.startsWith('/admin/coach/schedule/')) {
      return 'PT Schedule';
    }
    if (pathname === '/admin/credits' || pathname?.startsWith('/admin/credits/')) {
      return 'Credits';
    }
    return 'Admin Portal';
  };

  return (
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '72px',
          background: '#141414',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          paddingLeft: `calc(${mainSidebarWidth} + ${secondarySidebarWidth} + 32px)`,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          width: '100%',
        }}
        className="admin-header"
      >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: '24px',
        }}
      >
        {/* Page Title */}
        {!hideTitle && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '0.37px',
              }}
            >
              {getPageTitle()}
            </h1>
          </div>
        )}
        {hideTitle && <div style={{ flex: 1, minWidth: 0 }} />}

        {/* Search Bar */}
        <div
          style={{
            flex: 1,
            maxWidth: '400px',
            position: 'relative',
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              background: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.5)';
              e.currentTarget.style.background = '#1f1f1f';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.background = '#1a1a1a';
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon width={18} height={18} />
          </span>
        </div>

        {/* Right Side Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Notifications */}
          <button
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <BellIcon width={18} height={18} />
            {notifications > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#FF3B30',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #141414',
                }}
              >
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* Action Button (if provided) */}
          {actionButton}

          {/* Settings/More Menu */}
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <SettingsIcon width={18} height={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .admin-header {
            padding: 0 16px 0 calc(60px + 16px) !important;
            height: 64px !important;
          }
          .admin-header h1 {
            font-size: 18px !important;
          }
          .admin-header input {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .admin-header {
            padding: 0 12px 0 calc(60px + 12px) !important;
          }
          .admin-header h1 {
            font-size: 16px !important;
          }
        }
      `}</style>
    </header>
  );
}
