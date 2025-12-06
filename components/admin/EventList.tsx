'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';

interface EventListProps {
  events: {
    past: any[];
    upcoming: any[];
    all: any[];
  };
  userId: string;
}

export default function EventList({ events, userId }: EventListProps) {
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Get the current day's time range for an event
  const getTodayTimeRange = (event: any) => {
    if (!event.start_at) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : startDate;

    // Check if today falls within the event's date range
    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(endDate);
    endDateOnly.setHours(23, 59, 59, 999);

    if (startDateOnly > todayEnd || endDateOnly < today) {
      return null; // Event is not active today
    }

    // Calculate today's start time
    let todayStart: Date;
    if (startDateOnly.getTime() === today.getTime()) {
      // Event starts today, use the actual start time
      todayStart = new Date(startDate);
    } else {
      // Event started earlier, use midnight of today
      todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
    }

    // Calculate today's end time
    let todayEndTime: Date;
    if (endDateOnly.getTime() === today.getTime()) {
      // Event ends today, use the actual end time
      todayEndTime = new Date(endDate);
    } else {
      // Event ends later, use end of today
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
    
    // Check if it's all day (midnight to 11:59 PM)
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

  // Defensive checks
  if (!events) {
    return (
      <div
        className="card"
        style={{
          padding: '32px',
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No events data available</p>
      </div>
    );
  }

  const upcomingEvents = events.upcoming || [];
  const pastEvents = events.past || [];
  const eventsToShow = viewMode === 'upcoming' ? upcomingEvents : pastEvents;

  const filteredEvents = eventsToShow.filter((event) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.title?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.location_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <SearchInput
          placeholder="Search events..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ maxWidth: '500px' }}
        />
      </div>

      {/* Toggle Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#1a1a1a',
          padding: '4px',
          borderRadius: '10px',
          width: 'fit-content',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => setViewMode('upcoming')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'upcoming' ? '#007AFF' : 'transparent',
            color: viewMode === 'upcoming' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setViewMode('past')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'past' ? '#007AFF' : 'transparent',
            color: viewMode === 'past' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Past ({pastEvents.length})
        </button>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
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
            {searchTerm
              ? 'No events found matching your search.'
              : `No ${viewMode === 'upcoming' ? 'upcoming' : 'past'} events`}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEvents.map((event) => (
              <div
                key={event.id}
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
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <h3
                    style={{
                      marginBottom: '8px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
                    {event.title}
                  </h3>
                  {event.description && (
                    <p
                      style={{
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '15px',
                        marginBottom: '12px',
                        lineHeight: '20px',
                      }}
                    >
                      {event.description}
                    </p>
                  )}
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'rgba(235, 235, 245, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {(() => {
                      const todayRange = getTodayTimeRange(event);
                      if (todayRange) {
                        return (
                          <>
                            <div>
                              <strong style={{ color: '#FFFFFF' }}>Date:</strong>{' '}
                              {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div>
                              <strong style={{ color: '#FFFFFF' }}>Time:</strong>{' '}
                              {formatTimeRange(todayRange.start, todayRange.end)}
                            </div>
                            {todayRange.isMultiDay && (
                              <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.5)' }}>
                                (Part of multi-day event: {formatDate(event.start_at)} - {event.end_at ? formatDate(event.end_at) : formatDate(event.start_at)})
                              </div>
                            )}
                          </>
                        );
                      } else {
                        // Fallback to original format if not active today
                        return (
                          <>
                            <div>
                              <strong style={{ color: '#FFFFFF' }}>Start:</strong>{' '}
                              {formatDate(event.start_at)}
                            </div>
                            {event.end_at && (
                              <div>
                                <strong style={{ color: '#FFFFFF' }}>End:</strong>{' '}
                                {formatDate(event.end_at)}
                              </div>
                            )}
                          </>
                        );
                      }
                    })()}
                    {event.location_name && (
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Location:</strong>{' '}
                        {event.location_name}
                      </div>
                    )}
                    {event.attendance_count !== undefined && (
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Participants:</strong>{' '}
                        {event.attendance_count} {event.attendance_count === 1 ? 'person' : 'people'} going
                      </div>
                    )}
                    {event.external_url && (
                      <div>
                        <a
                          href={event.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#007AFF',
                            textDecoration: 'none',
                            fontWeight: '500',
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
