'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, LocationIcon } from '@/components/icons/AdminIcons';

interface Event {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  external_url?: string | null;
  attendance_count?: number;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/admin/activities/${id}`);
        const data = await response.json();
        if (data.activity) {
          setEvent(data.activity);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000000',
          padding: '32px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000000',
          padding: '32px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Link href="/events" style={{ color: '#007AFF', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
          ← Back to Events
        </Link>
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <Link href="/events" style={{ color: '#007AFF', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
        ← Back to Events
      </Link>

      <div className="card" style={{ padding: '24px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '24px',
            color: '#FFFFFF',
          }}
        >
          {event.title}
        </h1>

        {event.description && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#FFFFFF' }}>Description</h2>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '16px', lineHeight: '24px' }}>{event.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon width={20} height={20} />
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Start</div>
              <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{formatDate(event.start_at)}</div>
            </div>
          </div>

          {event.end_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ClockIcon width={20} height={20} />
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>End</div>
                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{formatDate(event.end_at)}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClockIcon width={20} height={20} />
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Time</div>
              <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{formatTimeRange(event.start_at, event.end_at)}</div>
            </div>
          </div>

          {event.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LocationIcon width={20} height={20} />
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{event.location_name}</div>
              </div>
            </div>
          )}

          {event.attendance_count !== undefined && (
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Participants</div>
              <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>
                {event.attendance_count} {event.attendance_count === 1 ? 'person' : 'people'} going
              </div>
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
                  fontSize: '16px',
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
  );
}


