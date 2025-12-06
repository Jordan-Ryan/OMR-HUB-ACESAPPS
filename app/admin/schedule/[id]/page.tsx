'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, LocationIcon, PersonIcon } from '@/components/icons/AdminIcons';

// Icon mapping based on activity type (matches app's backend mapping)
const getIconForActivityType = (activityType: string): string => {
  switch (activityType) {
    case 'Circuits':
      return 'flame-outline'; // App displays as "HIIT" but saves as "flame-outline"
    case 'Running':
      return 'walk';
    case 'Pilates':
      return 'pilates';
    default:
      return 'flame-outline';
  }
};

interface Activity {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  cost?: number;
  activity_type?: string;
  icon?: string | null;
  route_link?: string | null;
  route_url?: string | null;
  host_user_id?: string | null;
  host_profile?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
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

interface ActivityMessage {
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
  };
}

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const currentTab = searchParams.get('tab') || 'upcoming';
  const [activity, setActivity] = useState<Activity | null>(null);
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; first_name?: string | null; last_name?: string | null; nickname?: string | null }>>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location_name: '',
    cost: 0,
    activity_type: '',
    host_user_id: '',
    icon: '',
    route_link: '',
  });
  const [hostSearchTerm, setHostSearchTerm] = useState('');
  const [showHostDropdown, setShowHostDropdown] = useState(false);

  const fetchActivity = async () => {
    try {
      const [activityResponse, messagesResponse] = await Promise.all([
        fetch(`/api/admin/activities/${id}`),
        fetch(`/api/admin/activities/${id}/messages`).catch(() => ({ json: async () => ({ messages: [] }) })),
      ]);
      
      const activityData = await activityResponse.json();
      const messagesData = await messagesResponse.json();
      
      if (activityData.activity) {
        setActivity(activityData.activity);
        // Initialize edit data
        const startDate = new Date(activityData.activity.start_at);
        const endDate = activityData.activity.end_at ? new Date(activityData.activity.end_at) : null;
        const formatLocalDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        setEditData({
          title: activityData.activity.title || '',
          description: activityData.activity.description || '',
          start_at: formatLocalDateTime(startDate),
          end_at: endDate ? formatLocalDateTime(endDate) : '',
          location_name: activityData.activity.location_name || '',
          cost: activityData.activity.cost !== undefined && activityData.activity.cost !== null ? activityData.activity.cost : 0,
          activity_type: activityData.activity.activity_type || 'Circuits',
          host_user_id: activityData.activity.host_user_id || '',
          icon: activityData.activity.icon || 'flame-outline',
          route_link: activityData.activity.route_url || activityData.activity.route_link || '',
        });
      }
      if (messagesData.messages) {
        setMessages(messagesData.messages);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

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

    if (id) {
      fetchActivity();
      fetchUsers();
    }
  }, [id]);

  // Fetch profile images
  useEffect(() => {
    const fetchProfileImages = async () => {
      const imageUrls: Record<string, string> = {};
      const imagePromises: Array<{ userId: string; avatarUrl: string }> = [];

      // Collect user IDs with avatar URLs
      if (activity?.host_user_id && activity.host_profile?.avatar_url) {
        imagePromises.push({
          userId: activity.host_user_id,
          avatarUrl: activity.host_profile.avatar_url,
        });
      }
      
      activity?.attendance?.forEach((att) => {
        if (att.profiles?.avatar_url && !imagePromises.find((p) => p.userId === att.user_id)) {
          imagePromises.push({
            userId: att.user_id,
            avatarUrl: att.profiles.avatar_url,
          });
        }
      });

      messages.forEach((msg) => {
        if (msg.profiles?.avatar_url && !imagePromises.find((p) => p.userId === msg.user_id)) {
          imagePromises.push({
            userId: msg.user_id,
            avatarUrl: msg.profiles.avatar_url,
          });
        }
      });

      await Promise.all(
        imagePromises.map(async ({ userId, avatarUrl }) => {
          if (avatarUrl.startsWith('http')) {
            imageUrls[userId] = avatarUrl;
            return;
          }

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

    if (activity || messages.length > 0) {
      fetchProfileImages();
    }
  }, [activity, messages]);

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

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/admin/activities/${id}/messages`, {
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

  const handleDeleteActivity = async () => {
    if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/activities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/schedule');
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

  const handleAddAttendee = async (userId?: string) => {
    const userIdToAdd = userId || selectedUserId;
    if (!userIdToAdd || addingAttendee) return;

    setAddingAttendee(true);
    try {
      const response = await fetch(`/api/admin/activities/${id}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userIdToAdd, status: 'attending' }),
      });

      if (response.ok) {
        // Refresh activity to get updated attendance
        const activityResponse = await fetch(`/api/admin/activities/${id}`);
        const activityData = await activityResponse.json();
        if (activityData.activity) {
          setActivity(activityData.activity);
        }
        setSelectedUserId('');
        setSearchTerm('');
        setShowUserDropdown(false);
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
    try {
      const response = await fetch(
        `/api/admin/activities/${id}/attendees?user_id=${userId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Refresh activity to get updated attendance
        const activityResponse = await fetch(`/api/admin/activities/${id}`);
        const activityData = await activityResponse.json();
        if (activityData.activity) {
          setActivity(activityData.activity);
        }
      } else {
        alert('Failed to remove attendee');
      }
    } catch (error) {
      console.error('Error removing attendee:', error);
      alert('Failed to remove attendee');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: editData.title,
        description: editData.description || null,
        start_at: new Date(editData.start_at).toISOString(),
        end_at: editData.end_at ? new Date(editData.end_at).toISOString() : null,
        location_name: editData.location_name || null,
        cost: parseInt(editData.cost.toString()),
        activity_type: editData.activity_type,
        host_user_id: editData.host_user_id || null,
        icon: editData.icon || null,
        route_link: editData.route_link || null,
      };

      const response = await fetch(`/api/admin/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchActivity();
        setIsEditing(false);
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset edit data to current activity data
    if (activity) {
      const startDate = new Date(activity.start_at);
      const endDate = activity.end_at ? new Date(activity.end_at) : null;
      const formatLocalDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      setEditData({
        title: activity.title || '',
        description: activity.description || '',
        start_at: formatLocalDateTime(startDate),
        end_at: endDate ? formatLocalDateTime(endDate) : '',
        location_name: activity.location_name || '',
        cost: activity.cost !== undefined && activity.cost !== null ? activity.cost : 0,
        activity_type: activity.activity_type || 'Circuits',
        host_user_id: activity.host_user_id || '',
        icon: activity.icon || 'flame-outline',
        route_link: activity.route_url || activity.route_link || '',
      });
    }
    setIsEditing(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-dropdown]')) {
        setShowUserDropdown(false);
        setShowHostDropdown(false);
      }
    };
    if (showUserDropdown || showHostDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown, showHostDropdown]);

  const renderProfilePicture = (userId: string, profile?: { first_name?: string | null; last_name?: string | null; nickname?: string | null; avatar_url?: string | null }, size: number = 40) => {
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
        <Link href="/admin/schedule" style={{ color: '#007AFF', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
          ← Back to Schedule
        </Link>
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Activity not found</p>
        </div>
      </div>
    );
  }

  const attendingUsers = activity?.attendance?.filter((a) => a.status === 'attending') || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link 
          href={`/admin/schedule?tab=${currentTab}`}
          style={{ 
            color: '#007AFF', 
            textDecoration: 'none', 
            marginBottom: '24px', 
            display: 'inline-block',
            fontSize: '17px',
          }}
        >
          ← Back to Schedule
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  style={{
                    fontSize: '34px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                    padding: '8px 0',
                    outline: 'none',
                    width: '100%',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select
                    value={editData.activity_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const newIcon = getIconForActivityType(newType);
                      let newCost = editData.cost;
                      
                      // Set default cost based on activity type
                      if (newType === 'Running' || newType === 'Pilates') {
                        newCost = 0;
                      } else if (newType === 'Circuits') {
                        newCost = 1;
                      }
                      
                      setEditData({ ...editData, activity_type: newType, icon: newIcon, cost: newCost });
                    }}
                    style={{
                      fontSize: '17px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      background: '#2c2c2e',
                      border: '1px solid rgba(84, 84, 88, 0.65)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      outline: 'none',
                    }}
                  >
                    <option value="Circuits">Circuits</option>
                    <option value="Running">Running</option>
                    <option value="Pilates">Pilates</option>
                  </select>
                  
                  {/* Icon Selection */}
                  <div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>Icon</div>
                    <select
                      value={editData.icon}
                      onChange={(e) => {
                        const selectedIcon = e.target.value;
                        setEditData({ ...editData, icon: selectedIcon });
                      }}
                      style={{
                        fontSize: '17px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        background: '#2c2c2e',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    >
                      <option value="flame-outline">HIIT</option>
                      <option value="walk">Running</option>
                      <option value="pilates">Pilates</option>
                      <option value="fitness">Fitness</option>
                      <option value="cycling">Cycling</option>
                      <option value="barbell">Gym</option>
                      <option value="yoga">Yoga</option>
                      <option value="wellness">Wellness</option>
                      <option value="walking">Walking</option>
                      <option value="swimming">Swimming</option>
                      <option value="tennis">Tennis</option>
                      <option value="basketball">Basketball</option>
                      <option value="football">Football</option>
                      <option value="boat">Rowing</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: '34px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                  {activity.title}
                </h1>
                {activity.activity_type && (
                  <div style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {activity.activity_type}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="button button-secondary"
                  style={{
                    fontSize: '15px',
                    padding: '12px 24px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="button button-primary"
                  style={{
                    fontSize: '15px',
                    padding: '12px 24px',
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="button button-secondary"
                  style={{
                    fontSize: '15px',
                    padding: '12px 24px',
                  }}
                >
                  Edit
                </button>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', marginBottom: '32px' }}>
        {/* Left Column - Main Details */}
        <div>
          {/* Description */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>Description</h2>
            {isEditing ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Add a description..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '17px',
                  lineHeight: '24px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '17px', lineHeight: '24px' }}>
                {activity.description || 'No description'}
              </p>
            )}
          </div>

          {/* Details */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#FFFFFF' }}>Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CalendarIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Date</div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.start_at ? editData.start_at.split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        const time = editData.start_at ? editData.start_at.split('T')[1] || '09:00' : '09:00';
                        setEditData({ ...editData, start_at: `${date}T${time}` });
                      }}
                      style={{
                        fontSize: '17px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: '500' }}>
                      {new Date(activity.start_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ClockIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Time</div>
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input
                        type="time"
                        value={editData.start_at ? editData.start_at.split('T')[1] || '' : ''}
                        onChange={(e) => {
                          const date = editData.start_at ? editData.start_at.split('T')[0] : new Date().toISOString().split('T')[0];
                          setEditData({ ...editData, start_at: `${date}T${e.target.value}` });
                        }}
                        style={{
                          fontSize: '17px',
                          color: '#FFFFFF',
                          fontWeight: '500',
                          background: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="time"
                        value={editData.end_at ? editData.end_at.split('T')[1] || '' : ''}
                        onChange={(e) => {
                          const date = editData.end_at ? editData.end_at.split('T')[0] : (editData.start_at ? editData.start_at.split('T')[0] : new Date().toISOString().split('T')[0]);
                          setEditData({ ...editData, end_at: `${date}T${e.target.value}` });
                        }}
                        style={{
                          fontSize: '17px',
                          color: '#FFFFFF',
                          fontWeight: '500',
                          background: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: '500' }}>{formatTimeRange(activity.start_at, activity.end_at)}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LocationIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Location</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location_name}
                      onChange={(e) => setEditData({ ...editData, location_name: e.target.value })}
                      placeholder="Location name"
                      style={{
                        fontSize: '17px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: '500' }}>
                      {activity.location_name || 'No location'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Cost</div>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={editData.cost}
                    onChange={(e) => setEditData({ ...editData, cost: parseInt(e.target.value) || 0 })}
                    style={{
                      fontSize: '17px',
                      color: '#FFFFFF',
                      fontWeight: '500',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      outline: 'none',
                      width: '200px',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: '500' }}>
                    {activity.cost === 0 ? 'Free' : `${activity.cost} credit${activity.cost !== 1 ? 's' : ''}`}
                  </div>
                )}
              </div>

              {/* Route Link (only for Running) */}
              {(isEditing ? editData.activity_type === 'Running' : activity.activity_type === 'Running') && (
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Route</div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData.route_link}
                      onChange={(e) => setEditData({ ...editData, route_link: e.target.value })}
                      placeholder="Route link (optional)"
                      style={{
                        fontSize: '17px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: '500' }}>
                      {(activity.route_url || activity.route_link) ? (
                        <a href={activity.route_url || activity.route_link} target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', textDecoration: 'none' }}>
                          {activity.route_url || activity.route_link}
                        </a>
                      ) : (
                        'No route link'
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#FFFFFF' }}>
              Comments ({messages.length})
            </h2>
            
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

            {messages.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                No comments yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((message) => (
                  <div key={message.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {renderProfilePicture(message.user_id, message.profiles, 40)}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                          {getUserName(message.profiles)}
                        </span>
                        <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {new Date(message.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '20px', margin: 0 }}>
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div>
          {/* Host */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>Host</h3>
            {isEditing ? (
              <div style={{ position: 'relative' }} data-user-dropdown>
                <input
                  type="text"
                  placeholder="Search users to set as host..."
                  value={hostSearchTerm}
                  onChange={(e) => {
                    setHostSearchTerm(e.target.value);
                    setShowHostDropdown(true);
                  }}
                  onFocus={() => setShowHostDropdown(true)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#2c2c2e',
                    border: '1px solid rgba(84, 84, 88, 0.65)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
                {showHostDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {users
                      .filter(u => {
                        if (!hostSearchTerm) return true;
                        const name = getUserName(u).toLowerCase();
                        return name.includes(hostSearchTerm.toLowerCase());
                      })
                      .slice(0, 10)
                      .map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setEditData({ ...editData, host_user_id: user.id });
                            setHostSearchTerm(getUserName(user));
                            setShowHostDropdown(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            color: '#FFFFFF',
                            fontSize: '15px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: editData.host_user_id === user.id ? 'rgba(0, 122, 255, 0.2)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (editData.host_user_id !== user.id) {
                              e.currentTarget.style.background = '#2c2c2e';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (editData.host_user_id !== user.id) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          {getUserName(user)}
                          {editData.host_user_id === user.id && (
                            <span style={{ marginLeft: '8px', color: '#007AFF' }}>✓</span>
                          )}
                        </div>
                      ))}
                    {users.filter(u => {
                      if (!hostSearchTerm) return true;
                      const name = getUserName(u).toLowerCase();
                      return name.includes(hostSearchTerm.toLowerCase());
                    }).length === 0 && (
                      <div style={{ padding: '10px 12px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                        No users found
                      </div>
                    )}
                  </div>
                )}
                {editData.host_user_id && (() => {
                  const selectedHost = users.find(u => u.id === editData.host_user_id);
                  return selectedHost ? (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#2c2c2e', borderRadius: '8px' }}>
                      {renderProfilePicture(editData.host_user_id, selectedHost, 40)}
                      <span style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                        {getUserName(selectedHost)}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              activity.host_user_id && activity.host_profile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {renderProfilePicture(activity.host_user_id, activity.host_profile, 48)}
                  <span style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: '500' }}>
                    {getUserName(activity.host_profile)}
                  </span>
                </div>
              ) : (
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}>No host assigned</div>
              )
            )}
          </div>

          {/* Attendance */}
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>
              Attending ({attendingUsers.length})
            </h3>
            
            {/* Add Attendee - Searchable Select */}
            <div style={{ marginBottom: '16px', position: 'relative' }} data-user-dropdown>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search users to add..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#2c2c2e',
                      border: '1px solid rgba(84, 84, 88, 0.65)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                  {showUserDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {users
                        .filter(u => {
                          const isAttending = attendingUsers.find(a => a.user_id === u.id);
                          if (isAttending) return false;
                          if (!searchTerm) return true;
                          const name = getUserName(u).toLowerCase();
                          return name.includes(searchTerm.toLowerCase());
                        })
                        .slice(0, 10)
                        .map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSearchTerm(getUserName(user));
                              setShowUserDropdown(false);
                              handleAddAttendee(user.id);
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              color: '#FFFFFF',
                              fontSize: '15px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#2c2c2e';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {getUserName(user)}
                          </div>
                        ))}
                      {users.filter(u => {
                        const isAttending = attendingUsers.find(a => a.user_id === u.id);
                        if (isAttending) return false;
                        if (!searchTerm) return true;
                        const name = getUserName(u).toLowerCase();
                        return name.includes(searchTerm.toLowerCase());
                      }).length === 0 && (
                        <div style={{ padding: '10px 12px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                          No users found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (selectedUserId) {
                      handleAddAttendee(selectedUserId);
                    }
                  }}
                  disabled={!selectedUserId || addingAttendee}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedUserId ? '#007AFF' : 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !selectedUserId || addingAttendee ? 'not-allowed' : 'pointer',
                    opacity: !selectedUserId || addingAttendee ? 0.5 : 1,
                    fontSize: '20px',
                    fontWeight: '600',
                    padding: 0,
                  }}
                  title="Add attendee"
                >
                  +
                </button>
              </div>
            </div>

            {attendingUsers.length === 0 ? (
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}>No attendees yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {attendingUsers.map((attendee) => (
                  <div key={attendee.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {renderProfilePicture(attendee.user_id, attendee.profiles, 40)}
                      <span style={{ fontSize: '15px', color: '#FFFFFF' }}>
                        {getUserName(attendee.profiles)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAttendee(attendee.user_id)}
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 59, 48, 0.2)',
                        color: '#FF3B30',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: '600',
                        padding: 0,
                        lineHeight: '1',
                      }}
                      title="Remove attendee"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

