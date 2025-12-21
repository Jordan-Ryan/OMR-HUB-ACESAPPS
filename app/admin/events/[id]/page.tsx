'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, LocationIcon } from '@/components/icons/AdminIcons';
import { resizeImage, getImageDimensions, formatFileSize } from '@/lib/image-utils';
import ImageCropper from '@/components/ImageCropper';

interface Event {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location_name?: string | null;
  external_url?: string | null;
  image_url?: string | null;
  must_attend_all?: boolean | null;
  attendance_count?: number;
	  attendance?: Array<{
	    user_id: string;
	    status: string;
	    selected_days?: string[] | string | null;
	    start_times?: Record<string, string | null> | null;
	    profiles?: {
	      id: string;
	      first_name?: string | null;
      last_name?: string | null;
      nickname?: string | null;
      avatar_url?: string | null;
    };
  }>;
}

interface EventMessage {
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

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const currentTab = searchParams.get('tab') || 'upcoming';
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location_name: '',
    external_url: '',
    image_url: '',
    must_attend_all: false,
  });
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ originalSize: number; resizedSize: number; dimensions: { width: number; height: number } } | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const fetchEvent = async () => {
    try {
      const [eventResponse, messagesResponse] = await Promise.all([
        fetch(`/api/admin/events/${id}`),
        fetch(`/api/admin/events/${id}/messages`).catch(() => ({ json: async () => ({ messages: [] }) })),
      ]);
      
      if (!eventResponse.ok) {
        console.error('Event API error:', eventResponse.status, eventResponse.statusText);
        const errorText = await eventResponse.text();
        console.error('Error response:', errorText);
        return;
      }
      
      const eventData = await eventResponse.json();
      const messagesData = await messagesResponse.json();
      
      console.log('Raw eventData:', eventData);
      
      if (eventData.error) {
        console.error('API returned error:', eventData.error);
        return;
      }
      
      if (eventData.event) {
        console.log('Fetched event:', eventData.event);
        console.log('Event attendance:', eventData.event.attendance);
        console.log('Attendance count:', eventData.event.attendance?.length);
        console.log('Attendance array type:', Array.isArray(eventData.event.attendance));
        eventData.event.attendance?.forEach((att: any, idx: number) => {
          console.log(`Attendee ${idx}:`, {
            user_id: att.user_id,
            status: att.status,
            status_type: typeof att.status,
            selected_days: att.selected_days,
            selected_days_type: typeof att.selected_days,
            profile: att.profiles ? getUserName(att.profiles) : 'No profile',
            has_profile: !!att.profiles,
          });
        });
        setEvent(eventData.event);
        // Initialize edit data
        const startDate = new Date(eventData.event.start_at);
        const endDate = eventData.event.end_at ? new Date(eventData.event.end_at) : null;
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const formatTime = (date: Date) => {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        };
        // Preserve any unsaved image_url from editData if it exists
        const currentImageUrl = editData.image_url && !eventData.event.image_url 
          ? editData.image_url 
          : eventData.event.image_url || '';
        
        setEditData({
          title: eventData.event.title || '',
          description: eventData.event.description || '',
          start_date: formatDate(startDate),
          start_time: formatTime(startDate),
          end_date: endDate ? formatDate(endDate) : '',
          end_time: endDate ? formatTime(endDate) : '',
          location_name: eventData.event.location_name || '',
          external_url: eventData.event.external_url || '',
          image_url: currentImageUrl,
          must_attend_all: eventData.event.must_attend_all || false,
        });
      }
      if (messagesData.messages) {
        setMessages(messagesData.messages);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  // Update event image URL when event changes
  useEffect(() => {
    if (event?.image_url) {
      if (event.image_url.startsWith('http')) {
        setEventImageUrl(event.image_url);
      } else {
        // Fetch signed URL from Supabase Storage
        fetch(`/api/admin/events/image?path=${encodeURIComponent(event.image_url)}`)
          .then(res => res.json())
          .then(data => {
            if (data.url) {
              setEventImageUrl(data.url);
            } else {
              setEventImageUrl(event.image_url ?? null);
            }
          })
          .catch(() => {
            setEventImageUrl(event.image_url ?? null);
          });
      }
    } else {
      setEventImageUrl(null);
    }
  }, [event?.image_url]);

  // Fetch profile images
  useEffect(() => {
    const fetchProfileImages = async () => {
      const imageUrls: Record<string, string> = {};
      const imagePromises: Array<{ userId: string; avatarUrl: string }> = [];

      event?.attendance?.forEach((att) => {
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

    if (event || messages.length > 0) {
      fetchProfileImages();
    }
  }, [event, messages]);

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

  const formatTimeFromString = (timeString: string | null) => {
    if (!timeString) return '';
    // timeString is in format "HH:MM:SS" or "HH:MM"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/admin/events/${id}/messages`, {
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

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/events');
        router.refresh();
      } else {
        alert('Failed to delete event');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
      setDeleting(false);
    }
  };

  const handleImageSelect = (file: File) => {
    // Clear previous image state
    setImageInfo(null);
    setPendingImageFile(null);
    
    // Set new image
    setPendingImageFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropper(false);
    setUploadingImage(true);
    
    try {
      // Get original image dimensions and size
      const originalDimensions = await getImageDimensions(croppedFile);
      const originalSize = croppedFile.size;
      
      // Resize the cropped image (max 1920x1080, quality 0.85)
      const resizedFile = await resizeImage(croppedFile, 1920, 1080, 0.85);
      const resizedSize = resizedFile.size;
      
      // Store image info for display
      setImageInfo({
        originalSize,
        resizedSize,
        dimensions: originalDimensions,
      });
      
      const formData = new FormData();
      formData.append('file', resizedFile);
      
      const response = await fetch(`/api/admin/events/${id}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        console.error('Image upload error details:', error);
        throw new Error(error.error || error.details || 'Failed to upload image');
      }

      const data = await response.json();
      
      // The app expects full signed URLs stored in image_url (not just paths)
      // Use the signed URL if available, otherwise fall back to path
      const newImageUrl = data.url || data.path;
      
      // Update editData with the new image URL (full signed URL preferred)
      setEditData(prev => ({ ...prev, image_url: newImageUrl }));
      
      // Use the signed URL for immediate display
      if (data.url) {
        setEventImageUrl(data.url);
      } else if (data.path) {
        // If no signed URL, try to get one
        fetch(`/api/admin/events/image?path=${encodeURIComponent(data.path)}`)
          .then(res => res.json())
          .then(imgData => {
            if (imgData.url) {
              setEventImageUrl(imgData.url);
            }
          })
          .catch(() => {});
      }
      
      // Update the event in the database immediately with the new image URL
      // This ensures the image is saved even if user doesn't click Save
      try {
        const currentEvent = event; // Use the current event state
        if (currentEvent) {
          const saveResponse = await fetch(`/api/admin/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: currentEvent.title,
              description: currentEvent.description || null,
              start_at: currentEvent.start_at,
              end_at: currentEvent.end_at || null,
              location_name: currentEvent.location_name || null,
              external_url: currentEvent.external_url || null,
              image_url: newImageUrl, // Save the full signed URL (matches app format)
              must_attend_all: currentEvent.must_attend_all || false,
            }),
          });

          if (saveResponse.ok) {
            console.log('Image URL saved to event successfully');
            // Refresh event to get updated data
            await fetchEvent();
          } else {
            const errorText = await saveResponse.text();
            console.error('Failed to save image URL to event:', errorText);
            // Don't show error to user - they can still save manually
          }
        }
      } catch (saveError) {
        console.error('Error saving image URL to event:', saveError);
        // Don't show error to user - they can still save manually
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      setPendingImageFile(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPendingImageFile(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Combine date and time for start_at
      const startDateTime = editData.start_date && editData.start_time
        ? new Date(`${editData.start_date}T${editData.start_time}`).toISOString()
        : null;
      
      // Combine date and time for end_at
      const endDateTime = editData.end_date && editData.end_time
        ? new Date(`${editData.end_date}T${editData.end_time}`).toISOString()
        : null;

      if (!startDateTime) {
        alert('Start date and time are required');
        setSaving(false);
        return;
      }

      // Determine if event is multi-day
      const startDate = new Date(startDateTime);
      const endDate = endDateTime ? new Date(endDateTime) : startDate;
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const isMultiDay = startDateOnly.getTime() !== endDateOnly.getTime();
      
      // For single-day events, must_attend_all must be false
      // For multi-day events, use the checkbox value or default to false
      const mustAttendAllValue = isMultiDay ? (editData.must_attend_all === true) : false;

      const payload = {
        title: editData.title,
        description: editData.description || null,
        start_at: startDateTime,
        end_at: endDateTime,
        location_name: editData.location_name || null,
        external_url: editData.external_url || null,
        image_url: editData.image_url || null,
        must_attend_all: mustAttendAllValue, // Always a boolean, never null
      };

      console.log('Saving event with payload:', payload);

      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchEvent();
        setIsEditing(false);
      } else {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        console.error('Error saving event:', error);
        alert(error.error || error.details || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (event) {
      const startDate = new Date(event.start_at);
      const endDate = event.end_at ? new Date(event.end_at) : null;
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      setEditData({
        title: event.title || '',
        description: event.description || '',
        start_date: formatDate(startDate),
        start_time: formatTime(startDate),
        end_date: endDate ? formatDate(endDate) : '',
        end_time: endDate ? formatTime(endDate) : '',
        location_name: event.location_name || '',
        external_url: event.external_url || '',
        image_url: event.image_url || '',
        must_attend_all: event.must_attend_all || false,
      });
    }
    setIsEditing(false);
  };

  // Group attendees by day
  const groupedAttendees = useMemo(() => {
    if (!event?.attendance) return { fullEvent: [], byDay: {} };

    // Filter attending users - make it case-insensitive to handle variations
    const attendingUsers = event.attendance.filter((a) => 
      a.status && a.status.toLowerCase() === 'attending'
    );
    console.log('Total attendance records:', event.attendance.length);
    console.log('Attending users (status === "attending"):', attendingUsers.length);
    console.log('All attendance statuses:', event.attendance.map(a => ({ user_id: a.user_id, status: a.status, has_profile: !!a.profiles })));
    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : startDate;
    
    // Generate all days in the event
    const allDays: string[] = [];
    const currentDay = new Date(startDate);
    currentDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(endDate);
    lastDay.setHours(0, 0, 0, 0);
    
    while (currentDay <= lastDay) {
      const dayKey = currentDay.toISOString().split('T')[0];
      allDays.push(dayKey);
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const fullEvent: typeof attendingUsers = [];
    const byDay: Record<string, typeof attendingUsers> = {};

    // Initialize byDay with all days
    allDays.forEach(day => {
      byDay[day] = [];
    });

    attendingUsers.forEach((attendee) => {
      // Handle selected_days - it might be a string, array, or null
      let selectedDays: string[] = [];
      
      console.log('Processing attendee:', {
        user_id: attendee.user_id,
        selected_days_raw: attendee.selected_days,
        selected_days_type: typeof attendee.selected_days,
        is_array: Array.isArray(attendee.selected_days),
      });
      
      if (attendee.selected_days) {
        if (typeof attendee.selected_days === 'string') {
          try {
            selectedDays = JSON.parse(attendee.selected_days);
            console.log('Parsed JSON selected_days:', selectedDays);
          } catch (e) {
            // If it's not valid JSON, try splitting by comma or treat as single value
            selectedDays = attendee.selected_days.includes(',') 
              ? attendee.selected_days.split(',').map(d => d.trim())
              : [attendee.selected_days];
            console.log('Split selected_days:', selectedDays);
          }
        } else if (Array.isArray(attendee.selected_days)) {
          selectedDays = attendee.selected_days;
          console.log('Using array selected_days:', selectedDays);
        }
      } else {
        console.log('No selected_days, will add to full event');
      }
      
      // Normalize day keys to YYYY-MM-DD format
      const normalizedSelectedDays = selectedDays.map(day => {
        // If day is already in YYYY-MM-DD format, use it
        if (day.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return day;
        }
        // Otherwise try to parse it
        try {
          return new Date(day).toISOString().split('T')[0];
        } catch {
          return day;
        }
      });
      
      console.log('Normalized selected days:', normalizedSelectedDays);
      console.log('All event days:', allDays);
      console.log('Will add to full event?', normalizedSelectedDays.length === 0 || normalizedSelectedDays.length === allDays.length);
      
      // If selected_days is empty or null, or if user selected all days, add to full event
      if (normalizedSelectedDays.length === 0 || normalizedSelectedDays.length === allDays.length) {
        console.log('Adding to full event');
        fullEvent.push(attendee);
      } else {
        // Add to specific days
        console.log('Adding to specific days:', normalizedSelectedDays);
        normalizedSelectedDays.forEach((day: string) => {
          // Match day to one of the event days (handle timezone issues)
          const matchingDay = allDays.find(d => d === day || d.startsWith(day.split('T')[0]));
          if (matchingDay) {
            if (!byDay[matchingDay]) {
              byDay[matchingDay] = [];
            }
            // Only add if not already in this day's list
            if (!byDay[matchingDay].find(a => a.user_id === attendee.user_id)) {
              byDay[matchingDay].push(attendee);
              console.log(`Added to day ${matchingDay}`);
            }
          } else {
            console.log(`No matching day found for ${day}`);
          }
        });
      }
    });
    
    console.log('Final grouped attendees:', {
      fullEvent: fullEvent.length,
      byDay: Object.keys(byDay).map(k => ({ day: k, count: byDay[k].length })),
    });

    return { fullEvent, byDay };
  }, [event]);

  const formatDayLabel = (dayKey: string) => {
    const date = new Date(dayKey);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${dayName} ${day}${suffix}`;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
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
          background: '#0a0a0a',
          padding: '32px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Link href="/admin/events" style={{ color: '#007AFF', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
          ← Back to Events
        </Link>
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Event not found</p>
        </div>
      </div>
    );
  }

  const attendingUsers = event?.attendance?.filter((a) => 
    a.status && a.status.toLowerCase() === 'attending'
  ) || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        padding: '32px 24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Image */}
      {eventImageUrl && (
        <div style={{ 
          marginBottom: '24px', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          background: '#1a1a1a',
          border: '2px solid rgba(84, 84, 88, 0.3)',
          width: 'calc(100% - 48px)',
          maxWidth: 'calc(100% - 48px)',
          marginLeft: '24px',
          marginRight: '24px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          aspectRatio: '16 / 9',
          minHeight: '300px',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            boxSizing: 'border-box',
          }}>
            <img
              src={eventImageUrl}
              alt={event.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px', padding: '0 24px' }}>
        <a 
          href={`/admin/events?tab=${currentTab}`}
          style={{ 
            color: '#007AFF', 
            textDecoration: 'none', 
            marginBottom: '24px', 
            display: 'inline-block',
            fontSize: '17px',
          }}
        >
          ← Back to Events
        </a>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
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
            ) : (
              <h1 style={{ fontSize: '34px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                {event.title}
              </h1>
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
                  onClick={handleDeleteEvent}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', marginBottom: '32px', padding: '0 24px' }}>
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
                {event.description || 'No description'}
              </p>
            )}
          </div>


          {/* Attendees Section */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#FFFFFF' }}>
              Attendees ({attendingUsers.length})
            </h2>

            {attendingUsers.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                {event?.attendance && event.attendance.length > 0 ? (
                  <div>
                    <div>No attendees with status "attending"</div>
                    <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      Total records: {event.attendance.length} | Statuses: {[...new Set(event.attendance.map(a => a.status))].join(', ')}
                    </div>
                  </div>
                ) : (
                  'No attendees yet'
                )}
              </div>
            ) : (
              <>
                {/* Full Event Section */}
                {groupedAttendees.fullEvent.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>
                      Full Event ({groupedAttendees.fullEvent.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '16px' }}>
                      {groupedAttendees.fullEvent.map((attendee) => {
                        // Get start time if available (for full event, show first available start time)
                        const startTime = attendee.start_times ? Object.values(attendee.start_times).find(t => t) : null;
                        return (
                          <div key={attendee.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            {renderProfilePicture(attendee.user_id, attendee.profiles, 64)}
                            <span style={{ fontSize: '13px', color: '#FFFFFF', textAlign: 'center', wordBreak: 'break-word' }}>
                              {getUserName(attendee.profiles)}
                            </span>
                            {startTime && (
                              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                                {formatTimeFromString(startTime)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* By Day Sections */}
                {Object.entries(groupedAttendees.byDay)
                  .filter(([_, attendees]) => attendees.length > 0)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dayKey, attendees]) => (
                    <div key={dayKey} style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>
                        {formatDayLabel(dayKey)} ({attendees.length})
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '16px' }}>
                        {attendees.map((attendee) => {
                          // Get start time for this specific day
                          const startTime = attendee.start_times?.[dayKey] || null;
                          return (
                            <div key={attendee.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              {renderProfilePicture(attendee.user_id, attendee.profiles, 64)}
                              <span style={{ fontSize: '13px', color: '#FFFFFF', textAlign: 'center', wordBreak: 'break-word' }}>
                                {getUserName(attendee.profiles)}
                              </span>
                              {startTime && (
                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                                  {formatTimeFromString(startTime)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                {/* Fallback: If no grouping worked, show all attendees */}
                {groupedAttendees.fullEvent.length === 0 && 
                 Object.values(groupedAttendees.byDay).every(arr => arr.length === 0) && 
                 attendingUsers.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '16px' }}>
                      {attendingUsers.map((attendee) => {
                        // Get start time if available
                        const startTime = attendee.start_times ? Object.values(attendee.start_times).find(t => t) : null;
                        return (
                          <div key={attendee.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            {renderProfilePicture(attendee.user_id, attendee.profiles, 64)}
                            <span style={{ fontSize: '13px', color: '#FFFFFF', textAlign: 'center', wordBreak: 'break-word' }}>
                              {getUserName(attendee.profiles)}
                            </span>
                            {startTime && (
                              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                                {formatTimeFromString(startTime)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
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
          {/* Event Info */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '16px', color: '#FFFFFF' }}>Event Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Start Date & Time */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Start</div>
                {isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="date"
                      value={editData.start_date}
                      onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                      style={{
                        fontSize: '15px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#2c2c2e',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    <input
                      type="time"
                      value={editData.start_time}
                      onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                      style={{
                        fontSize: '15px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#2c2c2e',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                    {new Date(event.start_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {new Date(event.start_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>

              {/* End Date & Time */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>End</div>
                {isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="date"
                      value={editData.end_date}
                      onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                      style={{
                        fontSize: '15px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#2c2c2e',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    <input
                      type="time"
                      value={editData.end_time}
                      onChange={(e) => setEditData({ ...editData, end_time: e.target.value })}
                      style={{
                        fontSize: '15px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                        background: '#2c2c2e',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                    {event.end_at ? (
                      <>
                        {new Date(event.end_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        {new Date(event.end_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                )}
              </div>

              {/* Must Attend All - Only show for multi-day events */}
              {(() => {
                const startDate = new Date(event.start_at);
                const endDate = event.end_at ? new Date(event.end_at) : startDate;
                const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                const isMultiDay = startDateOnly.getTime() !== endDateOnly.getTime();
                
                if (!isMultiDay) return null;
                
                return (
                  <div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Must Attend All Days</div>
                    {isEditing ? (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          color: '#FFFFFF',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editData.must_attend_all}
                          onChange={(e) => setEditData({ ...editData, must_attend_all: e.target.checked })}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                          }}
                        />
                        <span>Users must attend all days</span>
                      </label>
                    ) : (
                      <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                        {event.must_attend_all ? 'Yes' : 'No'}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Location */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Location</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location_name}
                    onChange={(e) => setEditData({ ...editData, location_name: e.target.value })}
                    placeholder="Location name"
                    style={{
                      fontSize: '15px',
                      color: '#FFFFFF',
                      fontWeight: '500',
                      background: '#2c2c2e',
                      border: '1px solid rgba(84, 84, 88, 0.65)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                    {event.location_name || '-'}
                  </div>
                )}
              </div>

              {/* Image Upload - Only show when editing */}
              {isEditing && (
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Image</div>
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageSelect(file);
                        }
                        // Reset input value so same file can be selected again
                        e.target.value = '';
                      }}
                      disabled={uploadingImage}
                      style={{
                        fontSize: '15px',
                        color: '#FFFFFF',
                        background: '#2c2c2e',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        outline: 'none',
                        width: '100%',
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        opacity: uploadingImage ? 0.6 : 1,
                      }}
                    />
                    {uploadingImage && (
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                        Processing image...
                      </div>
                    )}
                    {imageInfo && !uploadingImage && (
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
                        <div>Size: {formatFileSize(imageInfo.originalSize)} → {formatFileSize(imageInfo.resizedSize)}</div>
                        <div style={{ marginTop: '4px' }}>
                          Dimensions: {imageInfo.dimensions.width} × {imageInfo.dimensions.height}px
                        </div>
                        {imageInfo.originalSize > imageInfo.resizedSize && (
                          <div style={{ marginTop: '4px', color: '#34C759' }}>
                            Reduced by {Math.round((1 - imageInfo.resizedSize / imageInfo.originalSize) * 100)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* External URL */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>External Link</div>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.external_url}
                    onChange={(e) => setEditData({ ...editData, external_url: e.target.value })}
                    placeholder="External URL (optional)"
                    style={{
                      fontSize: '15px',
                      color: '#FFFFFF',
                      fontWeight: '500',
                      background: '#2c2c2e',
                      border: '1px solid rgba(84, 84, 88, 0.65)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '500' }}>
                    {event.external_url ? (
                      <a
                        href={event.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#007AFF',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {event.external_url.length > 30 ? `${event.external_url.substring(0, 30)}...` : event.external_url}
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && pendingImageFile && (
        <ImageCropper
          imageFile={pendingImageFile}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
