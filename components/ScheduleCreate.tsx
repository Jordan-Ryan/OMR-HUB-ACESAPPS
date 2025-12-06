'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarIcon,
  ClockIcon,
  LocationIcon,
  PersonIcon,
} from '@/components/icons/AdminIcons';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
}

const normalizeLastName = (lastName?: string | null): string => {
  const cleanedLast = (lastName ?? '').trim();
  const PLACEHOLDER_LAST_NAME = 'tbc';
  return cleanedLast && cleanedLast.toLowerCase() !== PLACEHOLDER_LAST_NAME ? cleanedLast : '';
};

const getDefaultStartTime = () => {
  const defaultStart = new Date();
  defaultStart.setHours(6, 0, 0, 0);
  return defaultStart;
};

export default function ScheduleCreate() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [startTime, setStartTime] = useState<Date>(getDefaultStartTime());
  const [endTime, setEndTime] = useState<Date>(() => {
    const start = getDefaultStartTime();
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return end;
  });
  const [locationName, setLocationName] = useState('Highland House, RG41 4SP');
  const [activityType, setActivityType] = useState('Circuits');
  const [clientUserId, setClientUserId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('barbell');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Auto-update end time to be 1 hour after start time whenever start time changes
  useEffect(() => {
    const newEndTime = new Date(startTime);
    newEndTime.setHours(startTime.getHours() + 1);
    setEndTime(newEndTime);
  }, [startTime]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        if (data.users) {
          setAllUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Format date for display
  const formatDate = (date: Date) => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${weekday}, ${month} ${day}, ${year}`;
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get client name
  const clientName = useMemo(() => {
    if (!clientUserId) return 'Select Client';
    const client = allUsers.find((u) => u.id === clientUserId);
    return client
      ? [client.first_name, normalizeLastName(client.last_name)].filter(Boolean).join(' ') || 'Select Client'
      : 'Select Client';
  }, [clientUserId, allUsers]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) {
      return allUsers;
    }
    const query = clientSearchQuery.toLowerCase().trim();
    return allUsers.filter((client) => {
      const fullName = [client.first_name, normalizeLastName(client.last_name)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fullName.includes(query);
    });
  }, [allUsers, clientSearchQuery]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return title.trim().length > 0 && locationName.trim().length > 0;
  }, [title, locationName]);

  // Convert to ISO strings for API
  const getStartAtISO = () => {
    const date = new Date(selectedDate);
    date.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    return date.toISOString();
  };

  const getEndAtISO = () => {
    const date = new Date(selectedDate);
    date.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    return date.toISOString();
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      return;
    }

    try {
      const startAt = getStartAtISO();
      const endAt = getEndAtISO();

      setLoading(true);
      setErrors({});

      const attendees = [];
      if (clientUserId) {
        attendees.push(clientUserId);
      }

      const response = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          start_at: startAt,
          end_at: endAt,
          location_name: locationName,
          cost: 1,
          activity_type: activityType,
          icon: selectedIcon,
          visibility: 'private',
          attendees,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      router.push('/admin/schedule?tab=upcoming');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      alert(error.message || 'Failed to create schedule');
      setLoading(false);
    }
  };

  // Date input value
  const dateInputValue = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Time input values
  const startTimeValue = useMemo(() => {
    const hours = String(startTime.getHours()).padStart(2, '0');
    const minutes = String(startTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [startTime]);

  const endTimeValue = useMemo(() => {
    const hours = String(endTime.getHours()).padStart(2, '0');
    const minutes = String(endTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [endTime]);

  const FormRow = ({
    icon,
    label,
    value,
    onPress,
    placeholder,
    error,
  }: {
    icon: React.ReactNode;
    label?: string;
    value: string;
    onPress?: () => void;
    placeholder?: string;
    error?: string;
  }) => (
    <div
      onClick={onPress}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#1C1C1E',
        marginBottom: '8px',
        cursor: onPress ? 'pointer' : 'default',
        border: error ? '1px solid #FF3B30' : 'none',
      }}
    >
      <span
        style={{
          marginRight: '12px',
          width: '20px',
          height: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
        }}
      >
        {icon}
      </span>
      {label ? (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '17px', fontWeight: '500', color: value ? '#FFFFFF' : 'rgba(235, 235, 245, 0.3)' }}>
            {value || placeholder}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, fontSize: '17px', fontWeight: '500', color: value ? '#FFFFFF' : 'rgba(235, 235, 245, 0.3)' }}>
          {value || placeholder}
        </div>
      )}
      {onPress && <span style={{ fontSize: '20px', color: 'rgba(235, 235, 245, 0.3)' }}>›</span>}
    </div>
  );

  return (
    <div>
      {/* Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(84, 84, 88, 0.65)' }}>
        <Link href="/admin/schedule" style={{ color: '#FFFFFF', fontSize: '17px', textDecoration: 'none' }}>
          Cancel
        </Link>
        <div style={{ fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>Create Schedule</div>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          style={{
            background: 'transparent',
            border: 'none',
            color: isFormValid && !loading ? '#007AFF' : 'rgba(235, 235, 245, 0.3)',
            fontSize: '17px',
            fontWeight: '600',
            cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
            padding: '4px 8px',
          }}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Basic Information */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            fontSize: '17px',
            fontWeight: '400',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#1C1C1E',
            border: 'none',
            color: '#FFFFFF',
            marginBottom: '12px',
            minHeight: '44px',
          }}
        />
        {errors.title && (
          <div style={{ fontSize: '13px', color: '#FF3B30', marginTop: '-8px', marginBottom: '8px', marginLeft: '4px' }}>
            {errors.title}
          </div>
        )}

        <textarea
          placeholder="Details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            fontSize: '17px',
            fontWeight: '400',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#1C1C1E',
            border: 'none',
            color: '#FFFFFF',
            minHeight: '100px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Activity Type */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '8px' }}>
          Activity Type
        </label>
        <select
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#1C1C1E',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '17px',
            minHeight: '44px',
          }}
        >
          <option value="Circuits">Circuits</option>
          <option value="Running">Running</option>
          <option value="Pilates">Pilates</option>
        </select>
      </div>

      {/* Date and Time */}
      <div style={{ marginBottom: '24px' }}>
        <FormRow
          icon={<CalendarIcon width={18} height={18} />}
          value={formatDate(selectedDate)}
          onPress={() => setShowDatePicker(true)}
        />
        <FormRow
          icon={<ClockIcon width={18} height={18} />}
          value={formatTime(startTime)}
          onPress={() => setShowStartTimePicker(true)}
        />
        <FormRow
          icon={<ClockIcon width={18} height={18} />}
          value={formatTime(endTime)}
          onPress={() => setShowEndTimePicker(true)}
          placeholder="End time"
        />
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#1C1C1E',
            }}
          >
            <span
              style={{
                marginRight: '12px',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <LocationIcon width={18} height={18} />
            </span>
            <input
              type="text"
              placeholder="Location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              style={{
                flex: 1,
                fontSize: '17px',
                fontWeight: '400',
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                outline: 'none',
              }}
            />
          </div>
          {errors.locationName && (
            <div style={{ fontSize: '13px', color: '#FF3B30', marginTop: '4px', marginLeft: '4px' }}>
              {errors.locationName}
            </div>
          )}
        </div>
      </div>


      {/* Modals */}
      {showDatePicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setShowDatePicker(false)}
        >
          <div
            style={{
              width: '100%',
              background: '#1C1C1E',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => setShowDatePicker(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '17px', cursor: 'pointer' }}>
                Cancel
              </button>
              <div style={{ fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>Select Date</div>
              <div style={{ width: '60px' }} />
            </div>
            <input
              type="date"
              value={dateInputValue}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
                setShowDatePicker(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2C2C2E',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>
        </div>
      )}

      {showStartTimePicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setShowStartTimePicker(false)}
        >
          <div
            style={{
              width: '100%',
              background: '#1C1C1E',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => setShowStartTimePicker(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '17px', cursor: 'pointer' }}>
                Cancel
              </button>
              <div style={{ fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>Start Time</div>
              <button
                onClick={() => {
                  const [hours, minutes] = startTimeValue.split(':');
                  const newTime = new Date(startTime);
                  newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  setStartTime(newTime);
                  setShowStartTimePicker(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#007AFF', fontSize: '17px', fontWeight: '600', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
            <input
              type="time"
              value={startTimeValue}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newTime = new Date(startTime);
                newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                setStartTime(newTime);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2C2C2E',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>
        </div>
      )}

      {showEndTimePicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setShowEndTimePicker(false)}
        >
          <div
            style={{
              width: '100%',
              background: '#1C1C1E',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => setShowEndTimePicker(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '17px', cursor: 'pointer' }}>
                Cancel
              </button>
              <div style={{ fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>End Time</div>
              <button
                onClick={() => {
                  const [hours, minutes] = endTimeValue.split(':');
                  const newTime = new Date(endTime);
                  newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  setEndTime(newTime);
                  setShowEndTimePicker(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#007AFF', fontSize: '17px', fontWeight: '600', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
            <input
              type="time"
              value={endTimeValue}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newTime = new Date(endTime);
                newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                setEndTime(newTime);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2C2C2E',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '17px',
              }}
            />
          </div>
        </div>
      )}

      {/* Client Picker Modal */}
      {showClientPicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowClientPicker(false);
            setClientSearchQuery('');
          }}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '80%',
              background: '#1C1C1E',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(84, 84, 88, 0.65)' }}>
              <button
                onClick={() => {
                  setShowClientPicker(false);
                  setClientSearchQuery('');
                }}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '17px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <div style={{ fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>Select Client</div>
              <div style={{ width: '60px' }} />
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(84, 84, 88, 0.65)', background: '#2C2C2E' }}>
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1C1C1E',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '17px',
                }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredClients.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '17px', color: 'rgba(235, 235, 245, 0.6)' }}>
                    {clientSearchQuery.trim() ? 'No clients found' : 'No clients available'}
                  </div>
                </div>
              ) : (
                filteredClients.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => {
                      setClientUserId(member.id);
                      setShowClientPicker(false);
                      setClientSearchQuery('');
                    }}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(84, 84, 88, 0.65)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '17px', color: '#FFFFFF' }}>
                      {[member.first_name, normalizeLastName(member.last_name)].filter(Boolean).join(' ') || 'Unknown'}
                    </div>
                    {clientUserId === member.id && <span style={{ fontSize: '20px', color: '#007AFF' }}>✓</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

