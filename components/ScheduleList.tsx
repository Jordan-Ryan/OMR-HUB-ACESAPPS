'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarIcon, ClockIcon, LocationIcon, PersonIcon } from '@/components/icons/AdminIcons';
import SearchInput from '@/components/admin/SearchInput';

interface Activity {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  cost?: number;
  activity_type?: string;
  host_user_id?: string | null;
  host_profile?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
  attendees_confirmed?: boolean;
  attendance?: Array<{
    user_id: string;
    status: string;
    profiles?: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      nickname?: string | null;
      avatar_url?: string | null;
    };
  }>;
}

interface ScheduleListProps {
  filter: 'upcoming' | 'past' | 'circuits' | 'running' | 'pilates';
  activityType?: string;
  showCreateButton?: boolean;
}

export default function ScheduleList({ filter, activityType, showCreateButton = false }: ScheduleListProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'upcoming';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Determine if we should show the time filter (for circuits/running/pilates tabs)
  const showTimeFilter = activityType && ['circuits', 'running', 'pilates'].includes(filter);
  
  // Initialize timeFilter based on filter prop, but allow it to be changed for circuits/running/pilates
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>(() => {
    if (showTimeFilter) {
      return 'upcoming'; // Default to upcoming for activity type tabs
    }
    return filter === 'past' ? 'past' : 'upcoming';
  });
  
  // Update timeFilter when filter prop changes (but only if not on activity type tab)
  useEffect(() => {
    if (!showTimeFilter) {
      setTimeFilter(filter === 'past' ? 'past' : 'upcoming');
    }
  }, [filter, showTimeFilter]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const now = new Date();
        
        // Fetch all activities first, then filter client-side for better control
        const response = await fetch('/api/admin/activities');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error:', response.status, errorData);
          throw new Error(`Failed to fetch activities: ${response.status} ${errorData.error || ''}`);
        }
        const data = await response.json();
        console.log('Fetched activities data:', { count: data.activities?.length, activities: data.activities?.slice(0, 3) });
        let fetchedActivities = data.activities || [];

        // Exclude PT activities - only show Circuits, Running, Pilates
        fetchedActivities = fetchedActivities.filter(
          (a: Activity) => a.activity_type && 
          a.activity_type !== 'PT' && 
          ['Circuits', 'Running', 'Pilates'].includes(a.activity_type)
        );

        // Filter by specific activity type if specified
        if (activityType) {
          fetchedActivities = fetchedActivities.filter(
            (a: Activity) => a.activity_type?.toLowerCase() === activityType.toLowerCase()
          );
        }

        // Filter by past/upcoming based on end date
        // For circuits/running/pilates tabs, use timeFilter state; otherwise use filter prop
        const effectiveTimeFilter = showTimeFilter ? timeFilter : (filter === 'past' ? 'past' : 'upcoming');
        
        if (effectiveTimeFilter === 'past') {
          fetchedActivities = fetchedActivities.filter((a: Activity) => {
            const endDate = a.end_at ? new Date(a.end_at) : new Date(a.start_at);
            return endDate < now;
          });
        } else {
          // upcoming
          fetchedActivities = fetchedActivities.filter((a: Activity) => {
            const endDate = a.end_at ? new Date(a.end_at) : new Date(a.start_at);
            return endDate >= now;
          });
        }

        // Sort: upcoming ascending, past descending
        fetchedActivities.sort((a: Activity, b: Activity) => {
          const dateA = new Date(a.start_at).getTime();
          const dateB = new Date(b.start_at).getTime();
          return effectiveTimeFilter === 'past' ? dateB - dateA : dateA - dateB;
        });

        setActivities(fetchedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Show error to user
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filter, activityType, timeFilter, showTimeFilter]);

  // Fetch profile images for hosts and attendees
  useEffect(() => {
    const fetchProfileImages = async () => {
      const imageUrls: Record<string, string> = {};
      const imagePromises: Array<{ userId: string; avatarUrl: string }> = [];

      // Collect all user IDs with avatar URLs (hosts and attendees)
      activities.forEach((activity) => {
        if (activity.host_user_id && activity.host_profile?.avatar_url) {
          imagePromises.push({
            userId: activity.host_user_id,
            avatarUrl: activity.host_profile.avatar_url,
          });
        }
        activity.attendance?.forEach((att) => {
          if (att.profiles?.avatar_url && !imagePromises.find((p) => p.userId === att.user_id)) {
            imagePromises.push({
              userId: att.user_id,
              avatarUrl: att.profiles.avatar_url,
            });
          }
        });
      });

      await Promise.all(
        imagePromises.map(async ({ userId, avatarUrl }) => {
          // If it's already a full URL, use it directly
          if (avatarUrl.startsWith('http')) {
            imageUrls[userId] = avatarUrl;
            return;
          }

          // Otherwise, get signed URL from Supabase Storage
          try {
            const response = await fetch(
              `/api/admin/users/profile-image?path=${encodeURIComponent(avatarUrl)}`
            );
            const data = await response.json();
            if (data.url) {
              imageUrls[userId] = data.url;
            }
          } catch (error) {
            console.error(`Error fetching profile image for user ${userId}:`, error);
          }
        })
      );

      setProfileImageUrls(imageUrls);
    };

    if (activities.length > 0) {
      fetchProfileImages();
    }
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) {
      return activities;
    }
    const searchLower = searchTerm.toLowerCase();
    return activities.filter(
      (activity) =>
        activity.title?.toLowerCase().includes(searchLower) ||
        activity.description?.toLowerCase().includes(searchLower) ||
        activity.location_name?.toLowerCase().includes(searchLower)
    );
  }, [activities, searchTerm]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeRange = (start: string, end?: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${startTime} - ${endTime}`;
  };

  const getUserName = (profile?: { first_name?: string | null; last_name?: string | null; nickname?: string | null }) => {
    if (!profile) return 'Unknown';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };

  const getInitials = (profile?: { first_name?: string | null; last_name?: string | null; nickname?: string | null }) => {
    if (!profile) return '?';
    const name = getUserName(profile);
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderProfilePicture = (userId: string, profile?: { first_name?: string | null; last_name?: string | null; nickname?: string | null; avatar_url?: string | null }, size: number = 36) => {
    const profileImageUrl = profileImageUrls[userId];
    const hasProfileImage = !!profileImageUrl && !failedImages.has(userId);
    const showImage = hasProfileImage && profileImageUrl;
    const initials = getInitials(profile);

    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: showImage
            ? 'transparent'
            : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.4}px`,
          fontWeight: '600',
          color: '#FFFFFF',
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {showImage ? (
          <img
            src={profileImageUrl}
            alt={getUserName(profile)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={() => {
              setFailedImages((prev) => new Set(prev).add(userId));
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        Loading schedule...
      </div>
    );
  }

  return (
    <div>
      {/* Search, Filters, and Create Button */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: '1' }}>
          <SearchInput
            placeholder="Search schedule..."
            value={searchTerm}
            onChange={setSearchTerm}
            style={{ maxWidth: '500px', flex: '1', minWidth: '200px' }}
          />
          
          {/* Time Filter for circuits/running/pilates tabs */}
          {showTimeFilter && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: '#1a1a1a',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                onClick={() => setTimeFilter('upcoming')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: timeFilter === 'upcoming' ? '#007AFF' : 'transparent',
                  color: timeFilter === 'upcoming' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Upcoming
              </button>
              <button
                onClick={() => setTimeFilter('past')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: timeFilter === 'past' ? '#007AFF' : 'transparent',
                  color: timeFilter === 'past' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Past
              </button>
            </div>
          )}
        </div>
        
        {/* Create Activity Button */}
        {showCreateButton && (
          <a
            href="/admin/schedule/create"
            className="button button-primary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              textDecoration: 'none',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            Create Activity
          </a>
        )}
      </div>

      {/* Activities Table */}
      {filteredActivities.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {searchTerm
            ? 'No activities found matching your search.'
            : `No ${filter === 'past' ? 'past' : 'upcoming'} activities`}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: '#0a0a0a' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0a0a0a' }}>
              <thead>
                <tr style={{ background: '#141414' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Host</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => {
                  const attendingUsers = activity.attendance?.filter((a) => a.status === 'attending') || [];
                  const displayAttendees = attendingUsers.slice(0, 5);
                  const remainingCount = Math.max(0, attendingUsers.length - 5);

                  return (
                    <tr
                      key={activity.id}
                      onClick={() => {
                        window.location.href = `/admin/schedule/${activity.id}?tab=${currentTab}`;
                      }}
                      style={{
                        background: '#0a0a0a',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0a0a0a';
                      }}
                    >
                      {/* Host */}
                      <td style={{ padding: '16px 20px' }}>
                        {activity.host_user_id && activity.host_profile ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {renderProfilePicture(activity.host_user_id, activity.host_profile, 36)}
                            <span style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                              {getUserName(activity.host_profile)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>-</span>
                        )}
                      </td>
                      {/* Title */}
                      <td style={{ padding: '16px 20px', fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                        {activity.title}
                      </td>
                      {/* Date */}
                      <td style={{ padding: '16px 20px', fontSize: '15px', color: '#FFFFFF' }}>
                        {formatDate(activity.start_at)}
                      </td>
                      {/* Time */}
                      <td style={{ padding: '16px 20px', fontSize: '15px', color: '#FFFFFF' }}>
                        {formatTimeRange(activity.start_at, activity.end_at)}
                      </td>
                      {/* Location */}
                      <td style={{ padding: '16px 20px', fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>
                        {activity.location_name || '-'}
                      </td>
                      {/* Type */}
                      <td style={{ padding: '16px 20px', fontSize: '15px', color: '#FFFFFF' }}>
                        {activity.activity_type || '-'}
                      </td>
                      {/* Attendance */}
                      <td style={{ padding: '16px 20px' }}>
                        {attendingUsers.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {displayAttendees.map((attendee) => (
                              <div key={attendee.user_id} style={{ position: 'relative' }}>
                                {renderProfilePicture(attendee.user_id, attendee.profiles, 32)}
                              </div>
                            ))}
                            {remainingCount > 0 && (
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#FFFFFF',
                                  border: '2px solid rgba(255, 255, 255, 0.2)',
                                }}
                              >
                                +{remainingCount}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
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
            Showing <strong style={{ color: '#FFFFFF' }}>{filteredActivities.length}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{activities.length}</strong> activities
          </div>
        </>
      )}
    </div>
  );
}

