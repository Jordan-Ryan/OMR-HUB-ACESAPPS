'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrophyIcon } from '@/components/icons/AdminIcons';

interface Challenge {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
}

interface ChallengesSidebarProps {
  mainSidebarWidth?: string;
}

export default function ChallengesSidebar({ mainSidebarWidth = '280px' }: ChallengesSidebarProps) {
  const pathname = usePathname();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('secondary-sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
    fetchChallenges();
  }, []);

  // Refresh challenges when pathname changes (e.g., after creating a challenge)
  useEffect(() => {
    if (pathname?.startsWith('/admin/challenges') && !pathname?.includes('/create')) {
      fetchChallenges();
    }
  }, [pathname]);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('challenges-sidebar-collapsed', String(isCollapsed));
      // Use the same key as secondary sidebar for consistency
      localStorage.setItem('secondary-sidebar-collapsed', String(isCollapsed));
      window.dispatchEvent(new Event('sidebar-toggle'));
    }
  }, [isCollapsed, isMounted]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/challenges');
      if (response.ok) {
        const data = await response.json();
        const challenges = data.challenges || [];
        
        // Sort challenges: active/upcoming by start date (oldest first), then past challenges (oldest first)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeOrUpcoming = challenges.filter((c: Challenge) => {
          const endDate = new Date(c.end_at);
          endDate.setHours(23, 59, 59, 999);
          return endDate >= today;
        }).sort((a: Challenge, b: Challenge) => {
          return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
        });
        
        const past = challenges.filter((c: Challenge) => {
          const endDate = new Date(c.end_at);
          endDate.setHours(23, 59, 59, 999);
          return endDate < today;
        }).sort((a: Challenge, b: Challenge) => {
          return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
        });
        
        setChallenges([...activeOrUpcoming, ...past]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getChallengeStatus = (challenge: Challenge) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(challenge.start_at);
    const endDate = new Date(challenge.end_at);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > today) {
      return { label: 'Upcoming', color: '#007AFF' };
    } else if (endDate < today) {
      return { label: 'Past', color: 'rgba(255, 255, 255, 0.4)' };
    } else {
      return { label: 'Active', color: '#34C759' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <aside
      style={{
        position: 'fixed',
        left: mainSidebarWidth,
        top: 0,
        bottom: 0,
        width: isCollapsed ? '40px' : '200px',
        background: '#1a1a1a',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 998,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
      className="challenges-sidebar"
    >
      {/* Title Section */}
      {!isCollapsed && (
        <div
          style={{
            height: '72px',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <TrophyIcon />
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.37px',
            }}
          >
            Challenges
          </h2>
        </div>
      )}

      {/* Challenges List */}
      {!isCollapsed && (
        <nav
          style={{
            flex: 1,
            padding: '12px 8px',
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
              }}
            >
              Loading...
            </div>
          ) : challenges.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
              }}
            >
              No challenges
            </div>
          ) : (
            challenges.map((challenge) => {
              const isActive = 
                pathname === `/admin/challenges/${challenge.id}` || 
                pathname?.startsWith(`/admin/challenges/${challenge.id}/`);
              const status = getChallengeStatus(challenge);
              
              return (
                <Link
                  key={challenge.id}
                  href={`/admin/challenges/${challenge.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    marginBottom: '4px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                    background: isActive
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(255, 255, 255, 0.2)'
                      : '1px solid transparent',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    }
                  }}
                >
                  <div
                    style={{
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '6px',
                    }}
                  >
                    {challenge.title}
                  </div>
                  <div
                    style={{
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: `${status.color}20`,
                        color: status.color,
                        border: `1px solid ${status.color}40`,
                        display: 'inline-block',
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDate(challenge.start_at)} - {formatDate(challenge.end_at)}
                  </div>
                </Link>
              );
            })
          )}
        </nav>
      )}

      {/* Bottom Section with Create Button and Collapse */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: isCollapsed ? '8px' : '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {!isCollapsed && (
          <Link
            href="/admin/challenges/create"
            style={{
              width: '100%',
              padding: '12px 8px',
              borderRadius: '8px',
              background: '#007AFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: '600',
              textAlign: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              minWidth: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0051D5';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#007AFF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }}>+</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Create Challenge</span>
          </Link>
        )}
        <button
          onClick={toggleCollapse}
          style={{
            width: isCollapsed ? '32px' : '100%',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: '500',
            gap: '8px',
            marginLeft: isCollapsed ? 'auto' : '0',
            marginRight: isCollapsed ? 'auto' : '0',
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
          <span>{isCollapsed ? '▶' : '◀'}</span>
          {!isCollapsed && <span style={{ fontSize: '14px' }}>Collapse</span>}
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .challenges-sidebar {
            left: 0 !important;
            width: 280px !important;
            transform: translateX(-100%);
          }
        }
      `}</style>
    </aside>
  );
}

