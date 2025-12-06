'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Footer from './Footer';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname?.startsWith('/admin/') && !isLoginPage;

  // Don't show navigation/footer for login page or admin pages (admin has its own layout)
  if (isLoginPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#000000',
        color: '#FFFFFF',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      }}
    >
      <Navigation />
      <main
        style={{
          flex: 1,
          width: '100%',
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

