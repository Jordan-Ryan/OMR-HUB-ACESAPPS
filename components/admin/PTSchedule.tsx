'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { CalendarIcon, CheckIcon, DumbbellIcon, PersonIcon } from '@/components/icons/AdminIcons';

interface TimeSlot {
  hour: number;
  startTime: Date;
  endTime: Date;
  ptSessions: Activity[];
  otherActivities: Activity[];
}

interface Activity {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  cost?: number;
  activity_type?: string;
  attendees_confirmed?: boolean;
  attendance?: Array<{
    user_id: string;
    status: string;
    profiles?: {
      first_name?: string | null;
      last_name?: string | null;
      nickname?: string | null;
    };
  }>;
}

export default function PTSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [loading, setLoading] = useState(true);
  const [ptSessions, setPTSessions] = useState<Activity[]>([]);
  const [otherActivities, setOtherActivities] = useState<Activity[]>([]);

  // Fetch PT sessions and activities for selected date
  const fetchDayData = useCallback(async () => {
    try {
      setLoading(true);

      // Normalize selectedDate to ensure it's just a date (no time component)
      const dateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const startOfDay = new Date(dateOnly);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateOnly);
      endOfDay.setHours(23, 59, 59, 999);

      const params = new URLSearchParams();
      params.append('start_date', startOfDay.toISOString());
      params.append('end_date', endOfDay.toISOString());

      const response = await fetch(`/api/admin/coach/pt-schedule?${params.toString()}`);
      const data = await response.json();
      const allActivities = data.activities || [];

      // All activities from this endpoint are PT sessions, but we'll still check
      // Separate PT sessions from other activities (if any)
      const pt = allActivities.filter((a: Activity) => !a.activity_type || a.activity_type === 'PT');
      const other = allActivities.filter((a: Activity) => a.activity_type && a.activity_type !== 'PT');

      setPTSessions(pt);
      setOtherActivities(other);
    } catch (error) {
      console.error('Error fetching day data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  // Generate time slots (5am to 11pm, hourly)
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    // Normalize selectedDate to ensure it's just a date (no time component)
    const dateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    for (let hour = 5; hour <= 23; hour++) {
      const startTime = new Date(dateOnly);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(dateOnly);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Find PT sessions that START in this time slot (only show once, in the slot where they start)
      const sessionsInSlot = ptSessions.filter((session) => {
        const sessionStart = new Date(session.start_at);
        // Only include if the session starts in this hour slot
        return sessionStart >= startTime && sessionStart < endTime;
      });

      // Find other activities that START in this time slot (only show once, in the slot where they start)
      const activitiesInSlot = otherActivities.filter((activity) => {
        const activityStart = new Date(activity.start_at);
        // Only include if the activity starts in this hour slot
        return activityStart >= startTime && activityStart < endTime;
      });

      slots.push({
        hour,
        startTime,
        endTime,
        ptSessions: sessionsInSlot,
        otherActivities: activitiesInSlot,
      });
    }
    return slots;
  }, [selectedDate, ptSessions, otherActivities]);

  // Collect all sessions for absolute positioning (only ones that start in a slot)
  const allSessionsForPositioning = useMemo(() => {
    const sessions: Array<{ session: Activity; slotIndex: number }> = [];
    timeSlots.forEach((slot, slotIndex) => {
      [...slot.ptSessions, ...slot.otherActivities].forEach((session) => {
        sessions.push({ session, slotIndex });
      });
    });
    return sessions;
  }, [timeSlots]);

  const formatTimeForBlock = (date: Date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };



  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    // Normalize to just the date (no time component)
    const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    setSelectedDate(normalizedDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const getUserName = (attendance: Activity['attendance']) => {
    if (!attendance || attendance.length === 0) return 'No client';
    const firstAttendee = attendance.find(a => a.status === 'attending');
    if (!firstAttendee?.profiles) return 'Unknown';
    const profile = firstAttendee.profiles;
    const name = 
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
      'Unknown';
    return name;
  };

  // Helper function to compare dates (ignoring time)
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = useMemo(() => {
    const today = new Date();
    // Normalize today to just the date (no time component)
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return isSameDay(selectedDate, todayNormalized);
  }, [selectedDate]);

  // Get date input value for date picker
  const dateInputValue = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
    }
  };

  const SLOT_HEIGHT = 60; // Height of each hour slot in pixels
  const MINUTES_PER_HOUR = 60;

  return (
    <div>
      {/* Date Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigateDay('prev')}
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#FFFFFF',
            fontSize: '24px',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <input
            type="date"
            value={dateInputValue}
            onChange={handleDateInputChange}
            style={{
              padding: '8px 12px',
              background: '#1C1C1E',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          />
          {!isToday && (
            <button
              onClick={goToToday}
              style={{
                padding: '8px 16px',
                background: '#2C2C2E',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => navigateDay('next')}
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#FFFFFF',
            fontSize: '24px',
          }}
        >
          →
        </button>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading schedule...</p>
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="card" style={{ padding: '96px 32px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', color: '#FFFFFF' }}>
            <CalendarIcon width={64} height={64} strokeWidth={1.4} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '400', marginBottom: '8px', color: '#FFFFFF' }}>
            No Sessions
          </h3>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            Tap on a time slot to create a PT session
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Render time slot rows */}
          {timeSlots.map((slot, slotIndex) => {
            const isPast = slot.startTime < new Date();
            const hasSessions = slot.ptSessions.length > 0 || slot.otherActivities.length > 0;

            return (
              <div
                key={slot.hour}
                style={{
                  display: 'flex',
                  marginBottom: 0,
                  alignItems: 'flex-start',
                  minHeight: `${SLOT_HEIGHT}px`,
                }}
              >
                {/* Time Block on the left */}
                <div
                  style={{
                    width: '70px',
                    height: `${SLOT_HEIGHT}px`,
                    borderRadius: '8px',
                    padding: '8px',
                    background: '#1C1C1E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    opacity: isPast ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '18px',
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    {formatTimeForBlock(slot.startTime)}
                  </div>
                </div>

                {/* Right side - empty space for sessions to be positioned absolutely */}
                <div style={{ flex: 1, minHeight: `${SLOT_HEIGHT}px`, position: 'relative' }} />
              </div>
            );
          })}

          {/* Render session cards with absolute positioning */}
          {allSessionsForPositioning.map(({ session }) => {
            const isPT = !session.activity_type || session.activity_type === 'PT';
            const clientName = isPT ? getUserName(session.attendance) : session.title;
            const sessionTitle = isPT ? `PT: ${clientName}` : session.title;
            
            // Calculate positioning for sessions that span multiple hours
            const sessionStart = new Date(session.start_at);
            const sessionEnd = session.end_at ? new Date(session.end_at) : new Date(sessionStart.getTime() + 60 * 60 * 1000);
            
            // Get the day start (5 AM) for reference
            const dayStart = new Date(selectedDate);
            dayStart.setHours(5, 0, 0, 0);
            
            // Calculate position relative to day start
            const startMinutes = (sessionStart.getTime() - dayStart.getTime()) / (1000 * 60);
            const endMinutes = (sessionEnd.getTime() - dayStart.getTime()) / (1000 * 60);
            
            // Calculate top position: minutes from day start * (slot height / minutes per hour)
            const top = (startMinutes / MINUTES_PER_HOUR) * SLOT_HEIGHT;
            
            // Calculate height: duration in minutes * (slot height / minutes per hour)
            const height = ((endMinutes - startMinutes) / MINUTES_PER_HOUR) * SLOT_HEIGHT;
            
            // Minimum height to ensure visibility
            const cardHeight = Math.max(40, height);

            return (
              <Link
                key={session.id}
                href={`/admin/coach/schedule/${session.id}`}
                style={{
                  position: 'absolute',
                  top: `${top}px`,
                  left: '82px', // Width of timeBlock (70) + marginRight (12)
                  right: '0',
                  height: `${cardHeight}px`,
                  background: '#1C1C1E',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'row',
                  border: '1px solid rgba(84, 84, 88, 0.65)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {/* Icon or Avatar */}
                {isPT ? (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      background: '#2C2C2E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#FFFFFF',
                    }}
                  >
                    <PersonIcon width={18} height={18} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '16px',
                      background: 'rgba(52, 199, 89, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px',
                      flexShrink: 0,
                      color: '#34C759',
                    }}
                  >
                    <DumbbellIcon width={18} height={18} />
                  </div>
                )}

                {/* Content - Only Title */}
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: 0,
                      lineHeight: '16px',
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sessionTitle}
                  </div>
                </div>

                {/* Confirmed Checkmark */}
                {session.attendees_confirmed && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: '#34C759' }}>
                    <CheckIcon width={18} height={18} strokeWidth={2} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
