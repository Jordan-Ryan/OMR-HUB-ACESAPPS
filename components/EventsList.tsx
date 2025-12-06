'use client';

import { useEffect, useState, useMemo } from 'react';
import SearchInput from '@/components/admin/SearchInput';

interface Event {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  external_url?: string | null;
  attendance_count?: number;
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

interface EventsListProps {
  viewMode: 'upcoming' | 'past';
  showCreateButton?: boolean;
}

export default function EventsList({ viewMode, showCreateButton = false }: EventsListProps) {
  const [events, setEvents] = useState<{ upcoming: Event[]; past: Event[] }>({
    upcoming: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Fetch from events table
        const response = await fetch('/api/admin/events');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error:', response.status, errorData);
          throw new Error(`Failed to fetch events: ${response.status} ${errorData.error || ''}`);
        }
        const data = await response.json();
        console.log('Fetched events data:', { count: data.events?.length, events: data.events?.slice(0, 3) });
        const allEvents = data.events || [];

        const now = new Date();
        const upcoming: Event[] = [];
        const past: Event[] = [];

        allEvents.forEach((event: any) => {
          const endDate = event.end_at ? new Date(event.end_at) : new Date(event.start_at);
          if (endDate >= now) {
            upcoming.push(event);
          } else {
            past.push(event);
          }
        });

        // Sort upcoming ascending, past descending
        upcoming.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        past.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

        setEvents({ upcoming, past });
      } catch (error: any) {
        console.error('Error fetching events:', error);
        console.error('Error details:', error?.message, error?.stack);
        // Show error to user
        setEvents({ upcoming: [], past: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch profile images for attendees
  useEffect(() => {
    const fetchProfileImages = async () => {
      const imageUrls: Record<string, string> = {};
      const imagePromises: Array<{ userId: string; avatarUrl: string }> = [];

      // Collect all user IDs with avatar URLs from all events
      events.upcoming.concat(events.past).forEach((event) => {
        event.attendance?.forEach((att) => {
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

    if (events.upcoming.length > 0 || events.past.length > 0) {
      fetchProfileImages();
    }
  }, [events]);

  const eventsToShow = viewMode === 'upcoming' ? events.upcoming : events.past;

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) {
      return eventsToShow;
    }
    const searchLower = searchTerm.toLowerCase();
    return eventsToShow.filter(
      (event) =>
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location_name?.toLowerCase().includes(searchLower)
    );
  }, [eventsToShow, searchTerm]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTodayTimeRange = (event: Event) => {
    if (!event.start_at) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : startDate;

    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(endDate);
    endDateOnly.setHours(23, 59, 59, 999);

    if (startDateOnly > todayEnd || endDateOnly < today) {
      return null;
    }

    let todayStart: Date;
    if (startDateOnly.getTime() === today.getTime()) {
      todayStart = new Date(startDate);
    } else {
      todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
    }

    let todayEndTime: Date;
    if (endDateOnly.getTime() === today.getTime()) {
      todayEndTime = new Date(endDate);
    } else {
      todayEndTime = new Date(todayEnd);
    }

    return {
      start: todayStart,
      end: todayEndTime,
      isMultiDay: startDateOnly.getTime() !== endDateOnly.getTime(),
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = formatTime(start);
    const endTime = formatTime(end);

    const isAllDay =
      start.getHours() === 0 &&
      start.getMinutes() === 0 &&
      end.getHours() === 23 &&
      end.getMinutes() === 59;

    if (isAllDay) {
      return 'All Day';
    }

    return `${startTime}-${endTime}`;
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

  const renderProfilePicture = (userId: string, profile?: { first_name?: string | null; last_name?: string | null; nickname?: string | null; avatar_url?: string | null }, size: number = 32) => {
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
      <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Create Button */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <SearchInput
          placeholder="Search events..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ maxWidth: '500px', flex: '1', minWidth: '200px' }}
        />
        
        {/* Create Event Button */}
        {showCreateButton && (
          <a
            href="/admin/events/create"
            className="button button-primary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              textDecoration: 'none',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            Create Event
          </a>
        )}
      </div>

      {/* Events Table */}
      {filteredEvents.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {searchTerm
            ? 'No events found matching your search.'
            : `No ${viewMode === 'upcoming' ? 'upcoming' : 'past'} events`}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: '#0a0a0a' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#0a0a0a',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#141414',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Start
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    End
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Location
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Participants
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => (
                  <tr
                    key={event.id}
                    onClick={() => {
                      window.location.href = `/admin/events/${event.id}`;
                    }}
                    style={{
                      borderBottom:
                        index < filteredEvents.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: '#0a0a0a',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0a0a0a';
                    }}
                  >
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                      }}
                    >
                      <div>
                        <div style={{ marginBottom: '4px' }}>{event.title}</div>
                        {event.description && (
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'rgba(255, 255, 255, 0.6)',
                              marginTop: '4px',
                              lineHeight: '1.4',
                            }}
                          >
                            {event.description.length > 100
                              ? `${event.description.substring(0, 100)}...`
                              : event.description}
                          </div>
                        )}
                        {event.external_url && (
                          <a
                            href={event.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: '#007AFF',
                              textDecoration: 'none',
                              fontWeight: '500',
                              fontSize: '13px',
                              marginTop: '4px',
                              display: 'inline-block',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            External Link →
                          </a>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {formatDate(event.start_at)}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {event.end_at ? formatDate(event.end_at) : '-'}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {event.location_name || '-'}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        textAlign: 'right',
                      }}
                    >
                      {(() => {
                        const attendingUsers = event.attendance?.filter((a) => a.status === 'attending') || [];
                        const displayAttendees = attendingUsers.slice(0, 5);
                        const remainingCount = Math.max(0, attendingUsers.length - 5);

                        if (attendingUsers.length === 0) {
                          return <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>-</span>;
                        }

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                        );
                      })()}
                    </td>
                  </tr>
                ))}
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
            Showing <strong style={{ color: '#FFFFFF' }}>{filteredEvents.length}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{eventsToShow.length}</strong> events
          </div>
        </>
      )}
    </div>
  );
}

