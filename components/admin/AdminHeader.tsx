'use client';

import { usePathname } from 'next/navigation';

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

        {/* Right Side Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Action Button (if provided) */}
          {actionButton}
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
