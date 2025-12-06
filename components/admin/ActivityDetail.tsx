'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Activity {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  cost?: number;
  activity_type?: string;
  host_profile?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
  } | null;
  attendance?: Array<{
    user_id: string;
    status: string;
    profiles?: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      nickname?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
}

interface ActivityDetailProps {
  activityId: string;
}

export default function ActivityDetail({ activityId }: ActivityDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchActivity();
    fetchMessages();
    fetchUsers();
  }, [activityId]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/admin/activities/${activityId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.status}`);
      }
      const data = await response.json();
      if (data.activity) {
        setActivity(data.activity);
      } else {
        console.error('No activity data returned');
        setActivity(null);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setActivity(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/admin/activities/${activityId}/messages`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/admin/activities/${activityId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add comment');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddAttendee = async () => {
    if (!selectedUserId || addingAttendee) return;

    setAddingAttendee(true);
    try {
      const response = await fetch(`/api/admin/activities/${activityId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId, status: 'attending' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh activity to get updated attendance
        await fetchActivity();
        setSelectedUserId('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add attendee');
      }
    } catch (error) {
      console.error('Error adding attendee:', error);
      alert('Failed to add attendee');
    } finally {
      setAddingAttendee(false);
    }
  };

  const handleRemoveAttendee = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this attendee?')) return;

    try {
      const response = await fetch(
        `/api/admin/activities/${activityId}/attendees?user_id=${userId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Refresh activity to get updated attendance
        await fetchActivity();
      } else {
        alert('Failed to remove attendee');
      }
    } catch (error) {
      console.error('Error removing attendee:', error);
      alert('Failed to remove attendee');
    }
  };

  const handleDeleteActivity = async () => {
    if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/coach/schedule');
        router.refresh();
      } else {
        alert('Failed to delete activity');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (profile: { first_name?: string | null; last_name?: string | null; nickname?: string | null } | null | undefined) => {
    if (!profile) return 'Unknown';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ padding: '40px' }}>
        <h1 style={{ marginBottom: '24px' }}>Activity Details</h1>
        <div className="card">
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Activity not found</p>
        </div>
      </div>
    );
  }

  // Get users not already in attendance
  const attendeeUserIds = new Set(activity.attendance?.map(a => a.user_id) || []);
  const availableUsers = users.filter(u => !attendeeUserIds.has(u.id));

  return (
    <div>
      {/* Header with Edit and Delete buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Activity Details</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href={`/admin/coach/schedule/${activityId}/edit`}
            className="button button-secondary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Edit
          </Link>
          <button
            onClick={handleDeleteActivity}
            disabled={deleting}
            className="button"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              background: '#FF3B30',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Activity Details */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px' }}>{activity.title}</h2>

        {activity.description && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)', lineHeight: '20px' }}>
              {activity.description}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong style={{ color: 'rgba(235, 235, 245, 0.6)', display: 'block', marginBottom: '4px' }}>
              Start:
            </strong>
            <span style={{ color: '#FFFFFF' }}>{formatDate(activity.start_at)}</span>
          </div>

          {activity.end_at && (
            <div>
              <strong style={{ color: 'rgba(235, 235, 245, 0.6)', display: 'block', marginBottom: '4px' }}>
                End:
              </strong>
              <span style={{ color: '#FFFFFF' }}>{formatDate(activity.end_at)}</span>
            </div>
          )}

          {activity.location_name && (
            <div>
              <strong style={{ color: 'rgba(235, 235, 245, 0.6)', display: 'block', marginBottom: '4px' }}>
                Location:
              </strong>
              <span style={{ color: '#FFFFFF' }}>{activity.location_name}</span>
            </div>
          )}

          {activity.cost !== undefined && (
            <div>
              <strong style={{ color: 'rgba(235, 235, 245, 0.6)', display: 'block', marginBottom: '4px' }}>
                Cost:
              </strong>
              <span style={{ color: '#FFFFFF' }}>{activity.cost} credits</span>
            </div>
          )}

          {activity.activity_type && (
            <div>
              <strong style={{ color: 'rgba(235, 235, 245, 0.6)', display: 'block', marginBottom: '4px' }}>
                Type:
              </strong>
              <span style={{ color: '#FFFFFF' }}>{activity.activity_type}</span>
            </div>
          )}

          {activity.host_profile && (
            <div>
              <strong style={{ color: 'rgba(235, 235, 245, 0.6)', display: 'block', marginBottom: '4px' }}>
                Host:
              </strong>
              <span style={{ color: '#FFFFFF' }}>{getUserName(activity.host_profile)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendees Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px' }}>
          Attendees ({activity.attendance?.length || 0})
        </h2>

        {/* Add Attendee */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Add Attendee
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            >
              <option value="">Select a user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserName(user)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddAttendee}
            disabled={!selectedUserId || addingAttendee}
            className="button button-primary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              opacity: !selectedUserId || addingAttendee ? 0.6 : 1,
              cursor: !selectedUserId || addingAttendee ? 'not-allowed' : 'pointer',
            }}
          >
            {addingAttendee ? 'Adding...' : 'Add'}
          </button>
        </div>

        {/* Attendees List */}
        {activity.attendance && activity.attendance.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activity.attendance.map((attendance) => (
              <div
                key={attendance.user_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#2c2c2e',
                  borderRadius: '8px',
                  border: '1px solid rgba(84, 84, 88, 0.65)',
                }}
              >
                <div>
                  <div style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '4px' }}>
                    {getUserName(attendance.profiles)}
                  </div>
                  <div style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '14px' }}>
                    Status: {attendance.status}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAttendee(attendance.user_id)}
                  style={{
                    padding: '8px 16px',
                    background: '#FF3B30',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No attendees yet</p>
        )}
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Comments ({messages.length})</h2>

        {/* Add Comment Form */}
        <form onSubmit={handleAddMessage} style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2c2c2e',
                border: '1px solid rgba(84, 84, 88, 0.65)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessage}
            className="button button-primary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              opacity: !newMessage.trim() || sendingMessage ? 0.6 : 1,
              cursor: !newMessage.trim() || sendingMessage ? 'not-allowed' : 'pointer',
            }}
          >
            {sendingMessage ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        {messages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  padding: '16px',
                  background: '#2c2c2e',
                  borderRadius: '8px',
                  border: '1px solid rgba(84, 84, 88, 0.65)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    {getUserName(message.profiles)}
                  </div>
                  <div style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '14px' }}>
                    {formatDate(message.created_at)}
                  </div>
                </div>
                <div style={{ color: 'rgba(235, 235, 245, 0.9)', lineHeight: '20px', whiteSpace: 'pre-wrap' }}>
                  {message.message}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No comments yet</p>
        )}
      </div>
    </div>
  );
}

