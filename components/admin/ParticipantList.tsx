'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from './SearchInput';

interface Enrollment {
  id: string;
  user_id: string;
  status: 'pending' | 'onboarded';
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  enrolled_at: string;
  start_date?: string | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
}

interface ParticipantListProps {
  challengeId: string;
  challengeStartDate: string;
  challengeEndDate: string;
}

export default function ParticipantList({ 
  challengeId, 
  challengeStartDate, 
  challengeEndDate,
  statusFilter = 'all'
}: ParticipantListProps) {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, [challengeId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/challenges/${challengeId}/enrollments`);

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const data = await response.json();
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user: Enrollment['user']) => {
    if (!user) return 'Unknown User';
    // Always prefer first_name + last_name over nickname
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    // Fallback to nickname only if no first/last name
    if (user.nickname) return user.nickname;
    return 'Unknown User';
  };

  const handleApprove = async (enrollmentId: string) => {
    if (!confirm('Approve this enrollment?')) return;
    try {
      const response = await fetch(
        `/api/admin/challenges/${challengeId}/enrollments/${enrollmentId}/approve`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to approve enrollment');
      fetchEnrollments();
    } catch (error) {
      console.error('Error approving enrollment:', error);
      alert('Failed to approve enrollment');
    }
  };

  const handleReject = async (enrollmentId: string) => {
    if (!confirm('Reject this enrollment? This will delete the enrollment.')) return;
    try {
      const response = await fetch(
        `/api/admin/challenges/${challengeId}/enrollments/${enrollmentId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to reject enrollment');
      fetchEnrollments();
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      alert('Failed to reject enrollment');
    }
  };

  // Calculate individual days from challenge dates and group by week (Monday to Sunday)
  const calculateDaysAndWeeks = () => {
    if (!challengeStartDate || !challengeEndDate) return { days: [], weeks: [] };
    
    const start = new Date(challengeStartDate);
    const end = new Date(challengeEndDate);
    const days: Array<{ date: Date; dayNumber: number; weekNumber: number }> = [];
    const weeks: Array<{ weekNumber: number; startDate: Date; endDate: Date; startDayIndex: number; endDayIndex: number }> = [];
    
    // Find the Monday of the week containing the start date
    const getMonday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(d.setDate(diff));
    };
    
    // Find the Sunday of the week containing the end date
    const getSunday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust to get Sunday
      return new Date(d.setDate(diff));
    };
    
    const weekStart = getMonday(start);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = getSunday(end);
    weekEnd.setHours(23, 59, 59, 999);
    
    let currentDate = new Date(weekStart);
    let dayNumber = 1;
    let weekNumber = 1;
    let currentWeekStart = new Date(weekStart);
    let weekStartDayIndex = 0;
    
    while (currentDate <= weekEnd) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // If it's Monday, start a new week
      if (dayOfWeek === 1) {
        if (dayNumber > 1) {
          // Save previous week (ending on Sunday)
          const previousSunday = new Date(currentDate);
          previousSunday.setDate(previousSunday.getDate() - 1);
          weeks.push({
            weekNumber: weekNumber - 1,
            startDate: new Date(currentWeekStart),
            endDate: previousSunday,
            startDayIndex: weekStartDayIndex,
            endDayIndex: days.length - 1,
          });
        }
        currentWeekStart = new Date(currentDate);
        weekStartDayIndex = days.length;
        weekNumber++;
      }
      
      // Only add days that are within the challenge date range
      if (currentDate >= start && currentDate <= end) {
        days.push({
          date: new Date(currentDate),
          dayNumber,
          weekNumber: weekNumber - 1,
        });
        dayNumber++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add the last week (ending on Sunday)
    if (days.length > 0 && weeks.length > 0) {
      const lastWeek = weeks[weeks.length - 1];
      if (lastWeek.endDayIndex < days.length - 1) {
        // Update the last week's end date and index
        lastWeek.endDate = new Date(weekEnd);
        lastWeek.endDayIndex = days.length - 1;
      }
    } else if (days.length > 0) {
      // If no weeks were created yet, create one
      weeks.push({
        weekNumber: weekNumber - 1,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd),
        startDayIndex: weekStartDayIndex,
        endDayIndex: days.length - 1,
      });
    }
    
    return { days, weeks };
  };

  const { days, weeks } = calculateDaysAndWeeks();

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = getUserName(enrollment.user).toLowerCase();
    return userName.includes(searchLower);
  });

  // Separate pending and onboarded participants
  // Handle case where status might be null/undefined - treat as onboarded by default (legacy data)
  const pendingEnrollments = filteredEnrollments.filter(e => e.status === 'pending');
  const onboardedEnrollments = filteredEnrollments.filter(e => e.status === 'onboarded');
  
  // If there are enrollments that don't match either status (null, undefined, or other), add them to onboarded
  const otherEnrollments = filteredEnrollments.filter(e => 
    e.status !== 'pending' && 
    e.status !== 'onboarded'
  );
  
  // Add other enrollments to onboarded for display (treat null/undefined as onboarded)
  const allOnboardedEnrollments = [...onboardedEnrollments, ...otherEnrollments];
  
  // Filter based on statusFilter prop
  const displayPending = statusFilter === 'all' || statusFilter === 'pending';
  const displayOnboarded = statusFilter === 'all' || statusFilter === 'onboarded';

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: '48px',
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading participants...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ flex: 1 }}>
          <SearchInput
            placeholder="Search participants..."
            value={searchTerm}
            onChange={setSearchTerm}
            style={{ maxWidth: '500px' }}
          />
        </div>
      </div>

      {/* Pending Participants Section */}
      {displayPending && pendingEnrollments.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            Pending Participants ({pendingEnrollments.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingEnrollments.map((enrollment) => {
              const statusColor = '#FF9500';
              return (
                <div
                  key={enrollment.id}
                  className="card"
                  style={{
                    background: '#1a1a1a',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '20px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {enrollment.user?.avatar_url ? (
                        <img
                          src={enrollment.user.avatar_url}
                          alt={getUserName(enrollment.user)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {getUserName(enrollment.user)
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#FFFFFF',
                            }}
                          >
                            {getUserName(enrollment.user)}
                          </h3>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: `${statusColor}20`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`,
                              textTransform: 'capitalize',
                            }}
                          >
                            {enrollment.status}
                          </span>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {enrollment.fitness_level}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: 'rgba(235, 235, 245, 0.6)',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#FFFFFF' }}>Enrolled:</strong>{' '}
                            {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => router.push(`/admin/challenges/${challengeId}/participants/${enrollment.user_id}`)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Approve this enrollment?')) return;
                          try {
                            const response = await fetch(
                              `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}/approve`,
                              { method: 'POST' }
                            );
                            if (!response.ok) throw new Error('Failed to approve enrollment');
                            fetchEnrollments();
                          } catch (error) {
                            console.error('Error approving enrollment:', error);
                            alert('Failed to approve enrollment');
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#34C759',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Reject this enrollment? This will delete the enrollment.')) return;
                          try {
                            const response = await fetch(
                              `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}`,
                              { method: 'DELETE' }
                            );
                            if (!response.ok) throw new Error('Failed to reject enrollment');
                            fetchEnrollments();
                          } catch (error) {
                            console.error('Error rejecting enrollment:', error);
                            alert('Failed to reject enrollment');
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#FF3B30',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboarded Participants Table */}
      {displayOnboarded && allOnboardedEnrollments.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            {statusFilter === 'onboarded' ? 'Participants' : `Onboarded Participants (${allOnboardedEnrollments.length})`}
            {statusFilter === 'onboarded' && ` (${allOnboardedEnrollments.length})`}
          </h2>
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '70vh',
            }}
          >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: `${200 + (days.length * 60)}px`, // Participant column + days
            }}
          >
            {/* Week Header Row */}
            <thead>
              <tr
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <th
                  style={{
                    padding: '8px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'rgba(235, 235, 245, 0.7)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: 0,
                    background: 'rgba(255, 255, 255, 0.06)',
                    zIndex: 11,
                    minWidth: '200px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Week
                </th>
                {weeks.map((week) => {
                  const weekDays = days.filter(d => d.weekNumber === week.weekNumber);
                  return (
                    <th
                      key={week.weekNumber}
                      colSpan={weekDays.length}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.8)',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      Week {week.weekNumber}
                      <div style={{ fontSize: '10px', fontWeight: '400', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                        {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                        {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {/* Day Header Row */}
            <thead>
              <tr
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <th
                  style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(235, 235, 245, 0.7)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: 0,
                    background: '#1a1a1a', // Match card background
                    zIndex: 10,
                    minWidth: '200px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Participant
                </th>
                {days.map((day) => (
                  <th
                    key={day.dayNumber}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.7)',
                      minWidth: '60px',
                      width: '60px',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px' }}>
                        {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '400',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {/* Body Rows */}
            <tbody>
              {allOnboardedEnrollments.map((enrollment) => {
                return (
                  <tr
                    key={enrollment.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Participant Name Column */}
                    <td
                      style={{
                        padding: '16px',
                        position: 'sticky',
                        left: 0,
                        background: '#1a1a1a',
                        zIndex: 9,
                        minWidth: '200px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        {enrollment.user?.avatar_url ? (
                          <img
                            src={enrollment.user.avatar_url}
                            alt={getUserName(enrollment.user)}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.7)',
                            }}
                          >
                            {getUserName(enrollment.user)
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#FFFFFF',
                              marginBottom: '4px',
                            }}
                          >
                            {getUserName(enrollment.user)}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {enrollment.fitness_level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Week Columns */}
                    {days.map((day) => (
                      <td
                        key={day.dayNumber}
                        style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '12px',
                          minWidth: '60px',
                          width: '60px',
                        }}
                      >
                        {/* Placeholder for day data - can be customized later */}
                        -
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* No Results Message - Only show if no enrollments at all */}
      {!loading && enrollments.length === 0 && (
        <div
          className="card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            No participants found.
          </p>
        </div>
      )}
      
      {/* No Results After Search - Only show if search filtered everything out */}
      {!loading && enrollments.length > 0 && pendingEnrollments.length === 0 && allOnboardedEnrollments.length === 0 && searchTerm && (
        <div
          className="card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            No participants found matching your search.
          </p>
        </div>
      )}

      {/* Results Count */}
      {filteredEnrollments.length > 0 && (
        <div
          style={{
            marginTop: '24px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            padding: '12px 20px',
            background: '#1a1a1a',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'inline-block',
          }}
        >
          Showing <strong style={{ color: '#FFFFFF' }}>{filteredEnrollments.length}</strong> of{' '}
          <strong style={{ color: '#FFFFFF' }}>{enrollments.length}</strong> participants
          {pendingEnrollments.length > 0 && (
            <span style={{ marginLeft: '12px' }}>
              ({pendingEnrollments.length} pending, {allOnboardedEnrollments.length} onboarded)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
