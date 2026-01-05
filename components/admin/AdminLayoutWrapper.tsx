'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import TopNavigation from './TopNavigation';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login' || pathname?.includes('/admin/login');
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication on client side
  useEffect(() => {
    // Don't check auth on login page - it has its own layout
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Only redirect if we're not already on the login page
          if (!isLoginPage) {
            router.push('/admin/login');
          }
          return;
        }

        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError || !roleData || !roleData.is_admin) {
          // Only redirect if we're not already on the login page
          if (!isLoginPage) {
            router.push('/admin/login');
          }
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error checking auth:', error);
        // Only redirect if we're not already on the login page
        if (!isLoginPage) {
          router.push('/admin/login');
        }
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  // NOW WE CAN DO CONDITIONAL RETURNS - all hooks have been called
  // For login page, don't show navigation at all
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#FFFFFF',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Checking authentication...</p>
      </div>
    );
  }

  // Don't render admin UI if not authenticated (redirect should happen, but just in case)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <TopNavigation />
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
        }}
        className="admin-content-wrapper"
      >
        <main
          style={{
            padding: '32px',
            maxWidth: '1600px',
            margin: '0 auto',
          }}
          className="admin-main-content"
        >
          {children}
        </main>
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .admin-main-content {
            padding: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .admin-main-content {
            padding: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
