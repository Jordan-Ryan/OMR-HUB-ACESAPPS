'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import SecondarySidebar from './SecondarySidebar';
import ChallengesSidebar from './ChallengesSidebar';
import {
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  CoachIcon,
  GlobeIcon,
  ListIcon,
  LockIcon,
  PeopleIcon,
} from '@/components/icons/AdminIcons';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login' || pathname?.includes('/admin/login');
  const [muscleGroups, setMuscleGroups] = useState<Array<{ name: string; count: number }>>([]);
  const [userCounts, setUserCounts] = useState<{ members: number; guests: number }>({ members: 0, guests: 0 });
  
  // For login page, don't show navigation at all
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Fetch muscle groups for exercises page
  useEffect(() => {
    if (pathname?.startsWith('/admin/coach/exercises')) {
      fetch('/api/admin/exercises')
        .then((res) => res.json())
        .then((data) => {
          const exercises = data.exercises || [];
          const muscleGroupMap = new Map<string, number>();
          
          exercises.forEach((exercise: any) => {
            if (exercise.muscle_groups && Array.isArray(exercise.muscle_groups)) {
              exercise.muscle_groups.forEach((mg: string) => {
                const currentCount = muscleGroupMap.get(mg) || 0;
                muscleGroupMap.set(mg, currentCount + 1);
              });
            }
          });
          
          const muscleGroupsList = Array.from(muscleGroupMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
          
          setMuscleGroups(muscleGroupsList);
        })
        .catch((error) => {
          console.error('Error fetching muscle groups:', error);
        });
    }
  }, [pathname]);

  // Fetch user counts for users page
  useEffect(() => {
    if (pathname?.startsWith('/admin/users')) {
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => {
          const users = data.users || [];
          const members = users.filter((u: any) => !u.is_guest).length;
          const guests = users.filter((u: any) => u.is_guest).length;
          setUserCounts({ members, guests });
        })
        .catch((error) => {
          console.error('Error fetching user counts:', error);
        });
    }
  }, [pathname]);

  // Check if current route should show secondary sidebar
  const shouldShowSecondarySidebar = 
    pathname?.startsWith('/admin/coach/workouts') ||
    pathname?.startsWith('/admin/coach/exercises') ||
    pathname?.startsWith('/admin/coach/schedule') ||
    pathname?.startsWith('/admin/schedule') ||
    pathname?.startsWith('/admin/events') ||
    pathname?.startsWith('/admin/users') ||
    pathname?.startsWith('/admin/credits') ||
    pathname?.startsWith('/admin/challenges');

  // Get secondary sidebar config based on current route
  const getSecondarySidebarConfig = () => {
    if (pathname?.startsWith('/admin/coach/workouts')) {
      return {
        title: 'Workouts',
        items: [
          { filter: 'all', label: 'All Workouts', icon: <ListIcon /> },
          { filter: 'coach', label: 'Coach', icon: <CoachIcon /> },
          { filter: 'public', label: 'Public', icon: <GlobeIcon /> },
          { filter: 'private', label: 'Private', icon: <LockIcon /> },
        ],
        basePath: '/admin/coach/workouts',
        filterKey: 'filter',
      };
    }
    if (pathname?.startsWith('/admin/coach/exercises')) {
      const allCount = muscleGroups.reduce((sum, mg) => sum + mg.count, 0);
      const items = [
        { filter: 'all', label: 'All Exercises', icon: <ClipboardIcon />, count: allCount },
        ...muscleGroups.map((mg) => ({
          filter: mg.name.toLowerCase().trim().replace(/\s+/g, '-'),
          label: mg.name,
          icon: undefined,
          count: mg.count,
        })),
      ];
      return {
        title: 'Muscle Groups',
        items,
        basePath: '/admin/coach/exercises',
        filterKey: 'muscle_group',
      };
    }
    if (pathname?.startsWith('/admin/coach/schedule')) {
      return {
        title: 'PT Schedule',
        items: [
          { filter: 'all', label: 'All Sessions', icon: <CalendarIcon /> },
          { filter: 'upcoming', label: 'Upcoming', icon: <ClockIcon /> },
          { filter: 'past', label: 'Past', icon: <CheckIcon /> },
        ],
        basePath: '/admin/coach/schedule',
        filterKey: 'view',
      };
    }
    if (pathname?.startsWith('/admin/schedule')) {
      return {
        title: 'Schedule',
        items: [
          { filter: 'upcoming', label: 'Upcoming', icon: <ClockIcon /> },
          { filter: 'past', label: 'Past', icon: <CheckIcon /> },
          { filter: 'circuits', label: 'Circuits', icon: <CalendarIcon /> },
          { filter: 'running', label: 'Running', icon: <CalendarIcon /> },
          { filter: 'pilates', label: 'Pilates', icon: <CalendarIcon /> },
          { filter: 'circuit-attendance', label: 'Circuit Attendance', icon: <PeopleIcon /> },
          { filter: 'bulk-creation', label: 'Bulk Creation', icon: <ClipboardIcon /> },
        ],
        basePath: '/admin/schedule',
        filterKey: 'tab',
      };
    }
    if (pathname?.startsWith('/admin/events')) {
      return {
        title: 'Events',
        items: [
          { filter: 'upcoming', label: 'Upcoming', icon: <ClockIcon /> },
          { filter: 'past', label: 'Past', icon: <CheckIcon /> },
        ],
        basePath: '/admin/events',
        filterKey: 'tab',
      };
    }
    if (pathname?.startsWith('/admin/users')) {
      return {
        title: 'Users',
        items: [
          { filter: 'members', label: 'Members', icon: undefined, count: userCounts.members },
          { filter: 'guests', label: 'Guests', icon: undefined, count: userCounts.guests },
        ],
        basePath: '/admin/users',
        filterKey: 'type',
      };
    }
    if (pathname?.startsWith('/admin/credits')) {
      return {
        title: 'Credits',
        items: [
          { filter: 'circuits', label: 'Circuits', icon: <CalendarIcon /> },
          { filter: 'pt', label: 'PT', icon: <CoachIcon /> },
          { filter: 'partner-pt', label: 'Partner PT', icon: <PeopleIcon /> },
        ],
        basePath: '/admin/credits',
        filterKey: 'type',
      };
    }
    return null;
  };

  const secondarySidebarConfig = getSecondarySidebarConfig();
  
  // Get sidebar states from localStorage (will be managed by sidebar components)
  const [mainSidebarWidth, setMainSidebarWidth] = useState('280px');
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState('200px');
  
  useEffect(() => {
    const updateWidths = () => {
      const mainCollapsed = localStorage.getItem('admin-sidebar-collapsed') === 'true';
      const secondaryCollapsed = localStorage.getItem('secondary-sidebar-collapsed') === 'true';
      
      setMainSidebarWidth(mainCollapsed ? '80px' : '280px');
      setSecondarySidebarWidth(secondaryCollapsed ? '40px' : '200px');
    };
    
    updateWidths();
    // Listen for custom event when sidebars toggle
    window.addEventListener('sidebar-toggle', updateWidths);
    
    return () => {
      window.removeEventListener('sidebar-toggle', updateWidths);
    };
  }, []);
  
  const showChallengesSidebar = pathname?.startsWith('/admin/challenges');
  const contentMarginLeft = (shouldShowSecondarySidebar || showChallengesSidebar)
    ? `calc(${mainSidebarWidth} + ${secondarySidebarWidth})` 
    : mainSidebarWidth;

  return (
    <>
      <AdminSidebar />
      {showChallengesSidebar ? (
        <ChallengesSidebar mainSidebarWidth={mainSidebarWidth} />
      ) : secondarySidebarConfig ? (
        <SecondarySidebar
          title={secondarySidebarConfig.title}
          items={secondarySidebarConfig.items}
          basePath={secondarySidebarConfig.basePath}
          filterKey={secondarySidebarConfig.filterKey}
          mainSidebarWidth={mainSidebarWidth}
        />
      ) : null}
      <div
        style={{
          marginLeft: contentMarginLeft,
          minHeight: '100vh',
          background: '#0a0a0a',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="admin-content-wrapper"
      >
        <AdminHeader 
          mainSidebarWidth={mainSidebarWidth}
          secondarySidebarWidth={secondarySidebarWidth}
          hideTitle={!!secondarySidebarConfig || showChallengesSidebar}
        />
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
          .admin-content-wrapper {
            margin-left: 0 !important;
          }
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
