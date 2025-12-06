'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ActivityList from './ActivityList';
import EventList from './EventList';
import WorkoutList from './WorkoutList';
import ChallengeList from './ChallengeList';

interface UserDetailProps {
  userId: string;
}

interface UserData {
  profile: any;
  credits: {
    circuits: number;
    pt: number;
    joint_pt: number;
  };
  activities: {
    past: any[];
    upcoming: any[];
  };
  events: {
    past: any[];
    upcoming: any[];
    all: any[];
  };
  workouts: any[];
  assigned_workouts: any[];
  challenges: any[];
}

export default function UserDetail({ userId }: UserDetailProps) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activities' | 'events' | 'workouts' | 'challenges'>('activities');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (!data?.profile?.avatar_url) {
      setProfileImageUrl(null);
      return;
    }

    const getProfileImageUrl = async (avatarUrl: string) => {
      // If it's already a full URL, use it directly
      if (avatarUrl.startsWith('http')) {
        setProfileImageUrl(avatarUrl);
        return;
      }
      
      // Otherwise, get signed URL from Supabase Storage
      try {
        const response = await fetch(`/api/admin/users/profile-image?path=${encodeURIComponent(avatarUrl)}`);
        const data = await response.json();
        setProfileImageUrl(data.url || null);
      } catch (error) {
        console.error('Error fetching profile image:', error);
        setProfileImageUrl(null);
      }
    };

    getProfileImageUrl(data.profile.avatar_url);
  }, [data?.profile?.avatar_url]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      setData(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#FFFFFF' }}>
        Loading user details...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '24px', color: '#FFFFFF' }}>
        User not found
      </div>
    );
  }

  // Defensive checks for data structure
  const events = data.events || { past: [], upcoming: [], all: [] };
  const activities = data.activities || { past: [], upcoming: [] };
  const workouts = data.workouts || [];
  const assignedWorkouts = data.assigned_workouts || [];
  const challenges = data.challenges || [];
  const credits = data.credits || { circuits: 0, pt: 0, joint_pt: 0 };

  const displayName =
    `${data.profile?.first_name || ''} ${data.profile?.last_name || ''}`.trim() ||
    'Unknown';

  return (
    <div style={{ color: '#FFFFFF', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/admin/users"
          style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontSize: '15px',
            marginBottom: '16px',
            display: 'inline-block',
          }}
        >
          ← Back to Users
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={displayName}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '40px',
                objectFit: 'cover',
                border: '2px solid rgba(84, 84, 88, 0.65)',
              }}
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '40px',
                background: '#2C2C2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '600',
                color: '#FFFFFF',
                border: '2px solid rgba(84, 84, 88, 0.65)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ marginBottom: '8px' }}>{displayName}</h1>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '15px' }}>
              User ID: {userId}
            </p>
          </div>
        </div>
      </div>

      {/* Credits Display */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '22px' }}>Credits</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '15px' }}>
              Circuits Credits
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
              {credits.circuits}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '15px' }}>
              PT Credits
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
              {credits.pt}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '15px' }}>
              Joint PT Credits
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
              {credits.joint_pt}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(84, 84, 88, 0.65)',
        }}
      >
        {[
          { id: 'activities', label: `Activities (${activities.past.length + activities.upcoming.length})` },
          { id: 'events', label: `Events (${events.all.length})` },
          { id: 'workouts', label: `Workouts (${workouts.length + assignedWorkouts.length})` },
          { id: 'challenges', label: `Challenges (${challenges.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid #007AFF'
                  : '2px solid transparent',
              color:
                activeTab === tab.id
                  ? '#FFFFFF'
                  : 'rgba(235, 235, 245, 0.6)',
              fontSize: '17px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'activities' && (
          <ActivityList
            pastActivities={activities.past}
            upcomingActivities={activities.upcoming}
          />
        )}
        {activeTab === 'events' && (
          <EventList
            events={events}
            userId={userId}
          />
        )}
        {activeTab === 'workouts' && (
          <WorkoutList
            workouts={workouts}
            assignedWorkouts={assignedWorkouts}
            userId={userId}
          />
        )}
        {activeTab === 'challenges' && <ChallengeList challenges={challenges} />}
      </div>
    </div>
  );
}

