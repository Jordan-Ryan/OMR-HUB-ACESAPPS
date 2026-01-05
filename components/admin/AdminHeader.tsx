'use client';

import { usePathname } from 'next/navigation';

interface AdminHeaderProps {
  title?: string;
  actionButton?: React.ReactNode;
}

export default function AdminHeader({ 
  title, 
  actionButton,
}: AdminHeaderProps) {
  const pathname = usePathname();

  // Generate page title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    if (pathname === '/admin/users' || pathname?.startsWith('/admin/users/')) {
      return 'Users';
    }
    if (pathname === '/admin/challenges' || pathname?.startsWith('/admin/challenges/')) {
      return 'Challenges';
    }
    if (pathname === '/admin/schedule' || pathname?.startsWith('/admin/schedule/')) {
      return 'Schedule';
    }
    if (pathname === '/admin/events' || pathname?.startsWith('/admin/events/')) {
      return 'Events';
    }
    if (pathname === '/admin/credits' || pathname?.startsWith('/admin/credits/')) {
      return 'Credits';
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
    return 'Admin Portal';
  };

  return (
    <div
      style={{
        padding: '24px 32px 0 32px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Page Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.37px',
            }}
          >
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Side Actions */}
        {actionButton && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}
