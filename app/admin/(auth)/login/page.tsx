'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user is admin
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('is_admin')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!roleError && roleData?.is_admin) {
            // User is already logged in as admin, redirect to admin portal
            router.push('/admin/users');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Double check we're not already loading
    if (loading) {
      console.log('Already loading, ignoring submit');
      return;
    }
    
    console.log('=== LOGIN START ===', { email: email.substring(0, 5) + '...', hasPassword: !!password });
    setError(null);
    setLoading(true);

    // Don't clear the form fields - keep them visible
    const emailValue = email.trim();
    const passwordValue = password;

    if (!emailValue || !passwordValue) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('Step 1: Attempting login for:', emailValue);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });

      console.log('Step 2: Sign in response:', { hasData: !!data, hasUser: !!data?.user, error: signInError });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message || 'Failed to sign in');
        setLoading(false);
        return;
      }

      if (!data || !data.user) {
        console.error('No user returned from sign in');
        setError('No user returned from sign in');
        setLoading(false);
        return;
      }

      console.log('Step 3: User signed in successfully:', data.user.id);

      // Verify user is admin
      console.log('Step 4: Checking admin role...');
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('is_admin')
        .eq('user_id', data.user.id)
        .maybeSingle();

      console.log('Step 5: Role check result:', { roleData, roleError, isAdmin: roleData?.is_admin });

      if (roleError) {
        console.error('Role check error:', roleError);
        await supabase.auth.signOut();
        setError(`Access denied: ${roleError.message}`);
        setLoading(false);
        return;
      }

      if (!roleData || !roleData.is_admin) {
        console.error('User is not admin');
        await supabase.auth.signOut();
        setError('Access denied: Admin privileges required');
        setLoading(false);
        return;
      }

      console.log('Step 6: User is admin, ensuring session is set...');

      // Get the session to ensure cookies are set
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Step 7: Session check:', { hasSession: !!sessionData?.session, error: sessionError });
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Failed to establish session. Please try again.');
        setLoading(false);
        return;
      }

      if (!sessionData?.session) {
        console.error('No session found after login');
        setError('Session not established. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Step 8: Session confirmed, redirecting to /admin/users...');
      console.log('=== LOGIN SUCCESS ===');

      // Use window.location.replace for a hard redirect that bypasses React Router
      // This ensures the middleware runs and sees the new session
      window.location.replace('/admin/users');
    } catch (err) {
      console.error('=== LOGIN ERROR ===', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setLoading(false);
      // Restore form values if there's an error
      setEmail(emailValue);
      setPassword(passwordValue);
    }
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          padding: '24px',
        }}
      >
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        padding: '24px',
      }}
    >
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Admin Login</h1>
        
        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '17px',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '17px',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '8px',
                color: '#FF3B30',
                fontSize: '15px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              console.log('Button clicked, loading:', loading);
              if (!loading) {
                // Let the form onSubmit handle it
              }
            }}
            className="button button-primary"
            style={{
              width: '100%',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

