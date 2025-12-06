'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, LocationIcon, PersonIcon } from '@/components/icons/AdminIcons';

interface Activity {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  cost?: number;
  activity_type?: string;
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

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/admin/activities/${id}`);
        const data = await response.json();
        if (data.activity) {
          setActivity(data.activity);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchActivity();
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

  const getUserName = (attendance: Activity['attendance']) => {
    if (!attendance || attendance.length === 0) return 'No client';
    const firstAttendee = attendance.find((a) => a.status === 'attending');
    if (!firstAttendee?.profiles) return 'Unknown';
    const profile = firstAttendee.profiles;
    const name =
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
      'Unknown';
    return name;
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

  if (!activity) {
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
        <Link href="/schedule" style={{ color: '#007AFF', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
          ← Back to Schedule
        </Link>
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Activity not found</p>
        </div>
      </div>
    );
  }

  const isPT = !activity.activity_type || activity.activity_type === 'PT';
  const clientName = isPT ? getUserName(activity.attendance) : activity.title;

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
      <Link href="/schedule" style={{ color: '#007AFF', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
        ← Back to Schedule
      </Link>

      <div className="card" style={{ padding: '24px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '32px',
              background: isPT ? '#2C2C2E' : 'rgba(52, 199, 89, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: isPT ? '#FFFFFF' : '#34C759',
            }}
          >
            {isPT ? <PersonIcon width={32} height={32} /> : <CalendarIcon width={32} height={32} strokeWidth={1.4} />}
          </div>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#FFFFFF',
              }}
            >
              {isPT ? `PT: ${clientName}` : activity.title}
            </h1>
            {activity.activity_type && (
              <div style={{ fontSize: '16px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '16px' }}>
                Type: {activity.activity_type}
              </div>
            )}
          </div>
        </div>

        {activity.description && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#FFFFFF' }}>Description</h2>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '16px', lineHeight: '24px' }}>{activity.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon width={20} height={20} />
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Date</div>
              <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{formatDate(activity.start_at)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClockIcon width={20} height={20} />
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Time</div>
              <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{formatTimeRange(activity.start_at, activity.end_at)}</div>
            </div>
          </div>

          {activity.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LocationIcon width={20} height={20} />
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '500' }}>{activity.location_name}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

