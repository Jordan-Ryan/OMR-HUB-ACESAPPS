import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Don't require admin here - let middleware handle protection
  // Just check if user is admin to conditionally show navigation
  const user = await getCurrentUser();
  const showNavigation = user && user.is_admin;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#FFFFFF',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
        position: 'relative',
      }}
    >
      <AdminLayoutWrapper>
        {showNavigation ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        ) : (
          <main style={{ width: '100%', position: 'relative', zIndex: 1 }}>
            {children}
          </main>
        )}
      </AdminLayoutWrapper>
    </div>
  );
}
