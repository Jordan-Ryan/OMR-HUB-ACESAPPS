import type { ReactNode } from 'react';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Don't check auth here - let middleware handle it
  // The middleware will redirect unauthenticated users to /admin/login
  // The AdminLayoutWrapper will also do a client-side check
  // This prevents redirect loops since the login page uses this layout too

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
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </AdminLayoutWrapper>
    </div>
  );
}
