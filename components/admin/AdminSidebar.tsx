'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import { CalendarIcon, ClipboardIcon, DumbbellIcon, UsersIcon, BellIcon, CreditsIcon, TrophyIcon } from '@/components/icons/AdminIcons';

// Module-level cache to persist counts across navigation
let cachedCounts: Record<string, number> | null = null;
let countsCacheTimestamp: number | null = null;

interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface User {
  email?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
}

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

export default function AdminSidebar({ isCollapsed: initialCollapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    setMounted(true);
    fetchUser();
    
    // Load cached counts first (client-side only, after mount)
    const countsCached = localStorage.getItem('admin-sidebar-counts');
    const countsTimestamp = localStorage.getItem('admin-sidebar-counts-timestamp');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (countsCached && countsTimestamp && (now - parseInt(countsTimestamp)) < fiveMinutes) {
      try {
        const parsed = JSON.parse(countsCached);
        cachedCounts = parsed;
        countsCacheTimestamp = parseInt(countsTimestamp);
        setCounts(parsed);
      } catch (error) {
        console.error('Error parsing cached counts:', error);
        fetchCounts();
      }
    } else {
      // Only fetch if cache is missing or expired
      fetchCounts();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', String(isCollapsed));
      // Dispatch custom event to notify layout of width change
      window.dispatchEvent(new Event('sidebar-toggle'));
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, nickname')
        .eq('id', authUser.id)
        .single();
      
      setUser({
        email: authUser.email,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        nickname: profile?.nickname,
      });
    }
  };

  const fetchCounts = async () => {
    try {
      // Fetch counts for each section
      const [usersRes, workoutsRes, exercisesRes, scheduleRes, activitiesRes, eventsRes, challengesRes] = await Promise.all([
        fetch('/api/admin/users').catch(() => null),
        fetch('/api/admin/workouts').catch(() => null),
        fetch('/api/admin/exercises').catch(() => null),
        fetch('/api/admin/coach/pt-schedule').catch(() => null),
        fetch('/api/admin/activities').catch(() => null),
        fetch('/api/admin/events').catch(() => null),
        fetch('/api/admin/challenges').catch(() => null),
      ]);

      const countsData: Record<string, number> = {};

      if (usersRes?.ok) {
        const usersData = await usersRes.json();
        countsData.users = usersData.users?.length || 0;
      }

      if (workoutsRes?.ok) {
        const workoutsData = await workoutsRes.json();
        countsData.workouts = workoutsData.workouts?.length || 0;
      }

      if (exercisesRes?.ok) {
        const exercisesData = await exercisesRes.json();
        countsData.exercises = exercisesData.exercises?.length || 0;
      }

      if (scheduleRes?.ok) {
        const scheduleData = await scheduleRes.json();
        countsData.schedule = scheduleData.activities?.length || 0;
      }

      // Count upcoming schedule items (Circuits, Running, Pilates - not PT)
      if (activitiesRes?.ok) {
        const activitiesData = await activitiesRes.json();
        const now = new Date();
        const upcomingSchedule = (activitiesData.activities || []).filter((activity: any) => {
          // Only count Circuits, Running, Pilates (exclude PT)
          if (!activity.activity_type || activity.activity_type === 'PT') return false;
          if (!['Circuits', 'Running', 'Pilates'].includes(activity.activity_type)) return false;
          
          // Check if it's upcoming
          const endDate = activity.end_at ? new Date(activity.end_at) : new Date(activity.start_at);
          return endDate >= now;
        });
        countsData.scheduleUpcoming = upcomingSchedule.length;
      }

      // Count upcoming events
      if (eventsRes?.ok) {
        const eventsData = await eventsRes.json();
        const now = new Date();
        const upcomingEvents = (eventsData.events || []).filter((event: any) => {
          const endDate = event.end_at ? new Date(event.end_at) : new Date(event.start_at);
          return endDate >= now;
        });
        countsData.events = upcomingEvents.length;
      }

      // Count active challenges
      if (challengesRes?.ok) {
        const challengesData = await challengesRes.json();
        const now = new Date();
        const activeChallenges = (challengesData.challenges || []).filter((challenge: any) => {
          const startDate = new Date(challenge.start_at);
          const endDate = new Date(challenge.end_at);
          return startDate <= now && endDate >= now;
        });
        countsData.challenges = activeChallenges.length;
      }

      setCounts(countsData);
      // Cache the counts in both module-level cache and localStorage
      cachedCounts = countsData;
      countsCacheTimestamp = Date.now();
      localStorage.setItem('admin-sidebar-counts', JSON.stringify(countsData));
      localStorage.setItem('admin-sidebar-counts-timestamp', countsCacheTimestamp.toString());
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const navItems: NavItem[] = [
    { href: '/admin/users', label: 'Users', icon: <UsersIcon />, count: counts.users },
    { href: '/admin/challenges', label: 'Challenges', icon: <TrophyIcon />, count: counts.challenges },
    { href: '/admin/schedule', label: 'Schedule', icon: <CalendarIcon />, count: counts.scheduleUpcoming },
    { href: '/admin/events', label: 'Events', icon: <BellIcon />, count: counts.events },
    { href: '/admin/credits', label: 'Credits', icon: <CreditsIcon /> },
    { href: '/admin/coach/workouts', label: 'Workouts', icon: <DumbbellIcon />, count: counts.workouts },
    { href: '/admin/coach/exercises', label: 'Exercises', icon: <ClipboardIcon />, count: counts.exercises },
    { href: '/admin/coach/schedule', label: 'PT Schedule', icon: <CalendarIcon />, count: counts.schedule },
  ];

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const isActive = (href: string) => {
    if (href === '/admin/users') {
      return pathname === '/admin/users' || pathname?.startsWith('/admin/users/');
    }
    if (href === '/admin/challenges') {
      return pathname === '/admin/challenges' || pathname?.startsWith('/admin/challenges/');
    }
    if (href === '/admin/schedule') {
      return pathname === '/admin/schedule' || pathname?.startsWith('/admin/schedule/');
    }
    if (href === '/admin/events') {
      return pathname === '/admin/events' || pathname?.startsWith('/admin/events/');
    }
    if (href === '/admin/credits') {
      return pathname === '/admin/credits' || pathname?.startsWith('/admin/credits/');
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isCollapsed ? '80px' : '280px',
          background: '#141414',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          transform: 'translateX(0)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="admin-sidebar"
        data-open={isMobileOpen}
        data-collapsed={isCollapsed}
      >
        {/* Logo Section */}
        <div
          style={{
            height: '72px',
            padding: isCollapsed ? '0 12px' : '0 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            alignItems: 'center',
          }}
        >
          <Link
            href="/admin/users"
            style={{
              textDecoration: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? '0' : '12px',
              justifyContent: 'center',
            }}
            title={isCollapsed ? 'OMR Hub Admin' : ''}
          >
            <span
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              OMR
            </span>
            {!isCollapsed && (
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    letterSpacing: '0.37px',
                    color: '#FFFFFF',
                  }}
                >
                  OMR Hub
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: '0.2px',
                  }}
                >
                  Admin Portal
                </span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: isCollapsed ? '16px 8px' : '16px 12px',
            overflowY: 'auto',
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '0 12px 8px',
                marginBottom: '8px',
              }}
            >
              Navigation
            </div>
          )}
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '12px' : '12px 16px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  background: active
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'transparent',
                  border: active
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid transparent',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: active ? '600' : '500',
                  position: 'relative',
                }}
                title={isCollapsed ? item.label : ''}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '12px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span style={{ fontSize: '15px' }}>{item.label}</span>}
                </span>
                {mounted && !isCollapsed && item.count !== undefined && item.count > 0 && (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: active
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                      minWidth: '24px',
                      textAlign: 'center',
                    }}
                  >
                    {item.count}
                  </span>
                )}
                {mounted && isCollapsed && item.count !== undefined && item.count > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div
            style={{
              padding: '16px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                >
                  {getInitials()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                      'Admin'}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
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
              Sign Out
            </button>
          </div>
        )}
        {isCollapsed && (
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {user && (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
                title={`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin'}
                onClick={handleSignOut}
              >
                {getInitials()}
              </div>
            )}
          </div>
        )}
        
        {/* Toggle Button at Bottom */}
        <div
          style={{
            height: '56px',
            padding: '0 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={toggleCollapse}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#FFFFFF',
          fontSize: '20px',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="mobile-menu-button"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ☰
      </button>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: flex !important;
          }
          .admin-sidebar {
            width: 260px !important;
            transform: ${isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
        }
        @media (min-width: 769px) {
          .admin-sidebar {
            transform: translateX(0) !important;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
