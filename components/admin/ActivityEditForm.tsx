'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, LocationIcon, PersonIcon } from '@/components/icons/AdminIcons';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
}

interface ActivityEditFormProps {
  activityId?: string;
}

const normalizeLastName = (lastName?: string | null): string => {
  const cleanedLast = (lastName ?? '').trim();
  const PLACEHOLDER_LAST_NAME = 'tbc';
  return cleanedLast && cleanedLast.toLowerCase() !== PLACEHOLDER_LAST_NAME ? cleanedLast : '';
};

const getUserName = (user: User | null | undefined): string => {
  if (!user) return '';
  return [user.first_name, normalizeLastName(user.last_name)].filter(Boolean).join(' ') || 'Unknown';
};

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

// Get activity type from icon (reverse mapping)
const getActivityTypeFromIcon = (icon: string): string => {
  switch (icon) {
    case 'flame-outline':
      return 'Circuits';
    case 'walk':
      return 'Running';
    case 'pilates':
      return 'Pilates';
    default:
      return 'Circuits';
  }
};

// Get default location based on activity type
const getDefaultLocation = (activityType: string): string => {
  if (activityType === 'Circuits' || activityType === 'Pilates') {
    return 'Highland House, RG41 4SP';
  }
  return ''; // Running should be blank
};

export default function ActivityEditForm({ activityId }: ActivityEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!activityId);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [omarId, setOmarId] = useState<string | null>(null);
  const [samId, setSamId] = useState<string | null>(null);
  const [hostSearchTerm, setHostSearchTerm] = useState('');
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location_name: 'Highland House, RG41 4SP', // Default for Circuits
    cost: 1,
    activity_type: 'Circuits',
    icon: 'flame-outline',
    host_user_id: '',
    route_link: '',
  });

  // Fetch users and find Omar/Sam
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
          
          // Find Omar Ellaboudy and Sam Barnes
          const omar = data.users.find((u: User) => 
            (u.first_name?.toLowerCase().includes('omar') && u.last_name?.toLowerCase().includes('ellaboudy')) ||
            u.first_name?.toLowerCase() === 'omar'
          );
          const sam = data.users.find((u: User) => 
            (u.first_name?.toLowerCase().includes('sam') && u.last_name?.toLowerCase().includes('barnes')) ||
            (u.first_name?.toLowerCase() === 'sam' && u.last_name?.toLowerCase() === 'barnes')
          );
          
          if (omar) setOmarId(omar.id);
          if (sam) setSamId(sam.id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);


  // Set default host and location when creating new activity (once Omar/Sam IDs are available)
  useEffect(() => {
    if (!activityId) {
      let updates: any = {};
      
      // Set default host
      if (!formData.host_user_id) {
        if (formData.activity_type === 'Pilates' && samId) {
          updates.host_user_id = samId;
        } else if ((formData.activity_type === 'Circuits' || formData.activity_type === 'Running') && omarId) {
          updates.host_user_id = omarId;
        }
      }
      
      // Set default location
      if (!formData.location_name) {
        const defaultLocation = getDefaultLocation(formData.activity_type);
        if (defaultLocation) {
          updates.location_name = defaultLocation;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [omarId, samId, activityId, formData.activity_type, formData.host_user_id, formData.location_name]);

  useEffect(() => {
    if (activityId) {
      fetchActivity();
    }
  }, [activityId]);

  // Close host dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-dropdown]')) {
        setShowHostDropdown(false);
      }
    };

    if (showHostDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showHostDropdown]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/admin/activities/${activityId}`);
      const data = await response.json();
      if (data.activity) {
        // Parse dates in local timezone
        const startDate = new Date(data.activity.start_at);
        const endDate = data.activity.end_at ? new Date(data.activity.end_at) : null;
        
        // Convert to local datetime string format (YYYY-MM-DDTHH:mm)
        const formatLocalDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        
        setFormData({
          title: data.activity.title || '',
          description: data.activity.description || '',
          start_at: formatLocalDateTime(startDate),
          end_at: endDate ? formatLocalDateTime(endDate) : '',
          location_name: data.activity.location_name || '',
          cost: data.activity.cost !== undefined && data.activity.cost !== null ? data.activity.cost : 1,
          activity_type: data.activity.activity_type || 'Circuits',
          icon: data.activity.icon || getIconForActivityType(data.activity.activity_type || 'Circuits'),
          host_user_id: data.activity.host_user_id || '',
          route_link: data.activity.route_url || data.activity.route_link || '',
        });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = activityId
        ? `/api/admin/activities/${activityId}`
        : '/api/admin/activities';
      const method = activityId ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        description: formData.description || null,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        location_name: formData.location_name || null,
        cost: parseInt(formData.cost.toString()),
        activity_type: formData.activity_type,
        icon: formData.icon || null,
        host_user_id: formData.host_user_id || null,
        route_link: formData.route_link || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save activity');
      }

      if (activityId) {
        router.push(`/admin/schedule/${activityId}`);
      } else {
        router.push('/admin/schedule');
      }
      router.refresh();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      alert(error.message || 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeRange = (start: string, end?: string | null) => {
    if (!start) return '';
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
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link 
          href={activityId ? `/admin/schedule/${activityId}` : '/admin/schedule'} 
          style={{ 
            color: '#007AFF', 
            textDecoration: 'none', 
            marginBottom: '24px', 
            display: 'inline-block',
            fontSize: '17px',
          }}
        >
          ← Back to {activityId ? 'Activity' : 'Schedule'}
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1, marginRight: '24px' }}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Activity Title"
              required
              style={{
                width: '100%',
                fontSize: '34px',
                fontWeight: '700',
                color: '#FFFFFF',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 0',
                outline: 'none',
                marginBottom: '8px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={formData.activity_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const newIcon = getIconForActivityType(newType);
                  const newLocation = getDefaultLocation(newType);
                  let newHost = '';
                  let newCost = formData.cost;
                  
                  // Always set default host based on activity type when type changes
                  if (newType === 'Pilates' && samId) {
                    newHost = samId;
                  } else if ((newType === 'Circuits' || newType === 'Running') && omarId) {
                    newHost = omarId;
                  }
                  
                  // Set default cost based on activity type (always update cost when type changes)
                  if (newType === 'Running' || newType === 'Pilates') {
                    newCost = 0;
                  } else if (newType === 'Circuits') {
                    newCost = 1;
                  }
                  
                  setFormData({ ...formData, activity_type: newType, icon: newIcon, host_user_id: newHost, cost: newCost, location_name: newLocation });
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
              
              {/* Icon Selection - matches app display names */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>Icon</div>
                <select
                  value={formData.icon}
                  onChange={(e) => {
                    const selectedIcon = e.target.value;
                    // Only auto-update activity type for the main three types
                    let newType = formData.activity_type;
                    let newLocation = formData.location_name;
                    let newHost = formData.host_user_id;
                    let newCost = formData.cost;
                    
                    // Map icons to activity types (only for Circuits, Running, Pilates)
                    if (selectedIcon === 'flame-outline') {
                      newType = 'Circuits';
                      newLocation = getDefaultLocation('Circuits');
                      newHost = omarId || '';
                      newCost = 1;
                    } else if (selectedIcon === 'walk') {
                      newType = 'Running';
                      newLocation = getDefaultLocation('Running');
                      newHost = omarId || '';
                      newCost = 0;
                    } else if (selectedIcon === 'pilates') {
                      newType = 'Pilates';
                      newLocation = getDefaultLocation('Pilates');
                      newHost = samId || '';
                      newCost = 0;
                    }
                    // For other icons, keep current activity type and settings
                    
                    setFormData({ ...formData, icon: selectedIcon, activity_type: newType, host_user_id: newHost, cost: newCost, location_name: newLocation });
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
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="button button-secondary"
              style={{
                fontSize: '15px',
                padding: '12px 24px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="button button-primary"
              style={{
                fontSize: '15px',
                padding: '12px 24px',
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : activityId ? 'Save Changes' : 'Create Activity'}
            </button>
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
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          </div>

          {/* Details */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#FFFFFF' }}>Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CalendarIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Date</div>
                  <input
                    type="date"
                    value={formData.start_at ? formData.start_at.split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = formData.start_at ? formData.start_at.split('T')[1] || '09:00' : '09:00';
                      const startDateTime = `${date}T${time}`;
                      
                      // Update end time if start time exists
                      let endDateTime = formData.end_at;
                      if (formData.start_at && formData.end_at) {
                        const [startHours, startMinutes] = time.split(':');
                        const startDate = new Date(`${date}T${time}`);
                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                        const endHours = String(endDate.getHours()).padStart(2, '0');
                        const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
                        endDateTime = `${date}T${endHours}:${endMinutes}`;
                      }
                      
                      setFormData({ ...formData, start_at: startDateTime, end_at: endDateTime || formData.end_at });
                    }}
                    required
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
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ClockIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Start Time</div>
                  <input
                    type="time"
                    value={formData.start_at ? formData.start_at.split('T')[1] || '' : ''}
                    onChange={(e) => {
                      const date = formData.start_at ? formData.start_at.split('T')[0] : new Date().toISOString().split('T')[0];
                      const startTime = e.target.value;
                      const [hours, minutes] = startTime.split(':');
                      
                      // Calculate end time (+1 hour)
                      const startDate = new Date(`${date}T${startTime}`);
                      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
                      const endHours = String(endDate.getHours()).padStart(2, '0');
                      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
                      const endTime = `${endHours}:${endMinutes}`;
                      
                      setFormData({ 
                        ...formData, 
                        start_at: `${date}T${startTime}`,
                        end_at: formData.end_at ? `${formData.end_at.split('T')[0]}T${endTime}` : `${date}T${endTime}`
                      });
                    }}
                    required
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
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>End Time</div>
                    <input
                      type="time"
                      value={formData.end_at ? formData.end_at.split('T')[1] || '' : ''}
                      onChange={(e) => {
                        const date = formData.end_at ? formData.end_at.split('T')[0] : (formData.start_at ? formData.start_at.split('T')[0] : new Date().toISOString().split('T')[0]);
                        setFormData({ ...formData, end_at: `${date}T${e.target.value}` });
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
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LocationIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Location</div>
                  <input
                    type="text"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
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
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Cost (Credits)</div>
                <input
                  type="number"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
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
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div>
          {/* Host */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>Host</h3>
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
                          setFormData({ ...formData, host_user_id: user.id });
                          setHostSearchTerm(getUserName(user));
                          setShowHostDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: formData.host_user_id === user.id ? 'rgba(0, 122, 255, 0.2)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (formData.host_user_id !== user.id) {
                            e.currentTarget.style.background = '#2c2c2e';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.host_user_id !== user.id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {getUserName(user)}
                        {formData.host_user_id === user.id && (
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
              {formData.host_user_id && (() => {
                const selectedHost = users.find(u => u.id === formData.host_user_id);
                return selectedHost ? (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#2c2c2e', borderRadius: '8px' }}>
                    <PersonIcon width={20} height={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    <span style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                      {getUserName(selectedHost)}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Route Link (only for Running) */}
          {formData.activity_type === 'Running' && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>Route</h3>
              <input
                type="url"
                value={formData.route_link}
                onChange={(e) => setFormData({ ...formData, route_link: e.target.value })}
                placeholder="Route link (optional)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
            </div>
          )}

        </div>
      </div>
    </form>
  );
}

