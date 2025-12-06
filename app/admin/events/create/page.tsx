'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resizeImage, getImageDimensions, formatFileSize } from '@/lib/image-utils';
import ImageCropper from '@/components/ImageCropper';

export default function CreateEventPage() {
  const router = useRouter();
  
  // Get today's date in YYYY-MM-DD format for default start date
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get default time (9:00 AM)
  const getDefaultTime = () => {
    return '09:00';
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: getTodayDate(),
    start_time: getDefaultTime(),
    end_date: getTodayDate(), // Default to same as start date
    end_time: '',
    location_name: '',
    external_url: '',
    image_url: '',
    must_attend_all: false,
  });
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ originalSize: number; resizedSize: number; dimensions: { width: number; height: number } } | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const handleImageSelect = (file: File) => {
    // Clear previous image state
    setEventImageUrl(null);
    setImageInfo(null);
    setPendingImageFile(null);
    delete (window as any).pendingImageFile;
    
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
      
      // Store resized file for upload after event is created
      // We'll upload it after the event is created and we have an eventId
      (window as any).pendingImageFile = resizedFile;
      
      // Show preview using the resized file
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setEventImageUrl(result);
        }
      };
      reader.readAsDataURL(resizedFile);
    } catch (error) {
      console.error('Error preparing image:', error);
      alert('Failed to prepare image. Please try a different image.');
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
      const startDateTime = formData.start_date && formData.start_time
        ? new Date(`${formData.start_date}T${formData.start_time}`).toISOString()
        : null;
      
      // Combine date and time for end_at
      const endDateTime = formData.end_date && formData.end_time
        ? new Date(`${formData.end_date}T${formData.end_time}`).toISOString()
        : null;

      if (!startDateTime) {
        alert('Start date and time are required');
        setSaving(false);
        return;
      }

      if (!formData.title.trim()) {
        alert('Event title is required');
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
      const mustAttendAllValue = isMultiDay ? (formData.must_attend_all === true) : false;

      // First create the event (without image - we'll add it after upload)
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        start_at: startDateTime,
        end_at: endDateTime,
        location_name: formData.location_name?.trim() || null,
        external_url: formData.external_url?.trim() || null,
        image_url: formData.image_url || null, // Will be updated after image upload
        must_attend_all: mustAttendAllValue, // Always a boolean, never null
      };

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const data = await response.json();
      const eventId = data.event?.id;

      // If we have a pending image file, upload it now
      const pendingFile = (window as any).pendingImageFile;
      if (pendingFile && eventId) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('file', pendingFile);
          
          const imageResponse = await fetch(`/api/admin/events/${eventId}/upload-image`, {
            method: 'POST',
            body: imageFormData,
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            
            // The app expects full signed URLs stored in image_url (not just paths)
            // Use the signed URL if available, otherwise fall back to path
            const imageUrlToSave = imageData.url || imageData.path;
            
            // Update the event with the image URL (full signed URL preferred)
            const updateResponse = await fetch(`/api/admin/events/${eventId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                title: formData.title.trim(),
                description: formData.description?.trim() || null,
                start_at: startDateTime,
                end_at: endDateTime,
                location_name: formData.location_name?.trim() || null,
                external_url: formData.external_url?.trim() || null,
                image_url: imageUrlToSave, // Save the full signed URL (matches app format)
                must_attend_all: mustAttendAllValue, // Always a boolean
              }),
            });
            
            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              console.error('Failed to update event with image URL:', errorText);
            } else {
              console.log('Event image saved successfully');
            }
          } else {
            const errorText = await imageResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText };
            }
            console.error('Failed to upload image:', errorData);
            console.error('Response status:', imageResponse.status);
            // Don't fail the whole creation if image upload fails, but log the error
          }
        } catch (imageError: any) {
          console.error('Error uploading image:', imageError);
          console.error('Error details:', imageError?.message, imageError?.stack);
          // Don't fail the whole creation if image upload fails
        } finally {
          delete (window as any).pendingImageFile;
        }
      }

      router.push('/admin/events?tab=upcoming');
      router.refresh();
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  // Check if it's a multi-day event
  const isMultiDay = useMemo(() => {
    return formData.start_date && formData.end_date && formData.start_date !== formData.end_date;
  }, [formData.start_date, formData.end_date]);

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
      {/* Header Image Preview */}
      {eventImageUrl && (
        <div style={{ 
          marginBottom: '24px', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          background: '#1a1a1a',
          border: '2px solid rgba(84, 84, 88, 0.3)',
          width: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxSizing: 'border-box',
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
              alt="Event preview"
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
      <div style={{ marginBottom: '32px' }}>
        <Link 
          href="/admin/events"
          style={{ 
            color: '#007AFF', 
            textDecoration: 'none', 
            marginBottom: '24px', 
            display: 'inline-block',
            fontSize: '17px',
          }}
        >
          ← Back to Events
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event Title"
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
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/admin/events')}
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
              disabled={saving || !formData.title.trim()}
              className="button button-primary"
              style={{
                fontSize: '15px',
                padding: '12px 24px',
                opacity: saving || !formData.title.trim() ? 0.6 : 1,
                cursor: saving || !formData.title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Creating...' : 'Create'}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setFormData({
                        ...formData,
                        start_date: newStartDate,
                        // Default end_date to same as start_date if not set or if it's before start_date
                        end_date: !formData.end_date || formData.end_date < newStartDate ? newStartDate : formData.end_date,
                      });
                    }}
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
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
              </div>

              {/* End Date & Time */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>End</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
              </div>

              {/* Must Attend All - Only show for multi-day events */}
              {isMultiDay && (
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Must Attend All Days</div>
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
                      checked={formData.must_attend_all}
                      onChange={(e) => setFormData({ ...formData, must_attend_all: e.target.checked })}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                    <span>Users must attend all days</span>
                  </label>
                </div>
              )}

              {/* Location */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Location</div>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
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
              </div>

              {/* Image Upload */}
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

              {/* External URL */}
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>External Link</div>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
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
