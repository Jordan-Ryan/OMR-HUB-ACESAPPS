'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resizeImage, getImageDimensions } from '@/lib/image-utils';
import ImageCropper from '@/components/ImageCropper';

interface ChallengeFormProps {
  challengeId?: string;
  initialData?: any;
}

type CheckInFrequency = 'weekly' | 'biweekly' | 'monthly';

const CHECK_IN_FREQUENCIES: { value: CheckInFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function ChallengeForm({ challengeId, initialData }: ChallengeFormProps) {
  const router = useRouter();
  const isEditing = !!challengeId;

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 84); // Default to 12 weeks
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_at: initialData?.start_at ? initialData.start_at.split('T')[0] : getTodayDate(),
    end_at: initialData?.end_at ? initialData.end_at.split('T')[0] : getDefaultEndDate(),
    image_url: initialData?.image_url || '',
    default_min_steps: initialData?.default_min_steps?.toString() || '10000',
    calorie_multiplier: initialData?.calorie_multiplier?.toString() || '15',
    default_protein_percent: initialData?.default_protein_percent?.toString() || '35',
    default_carbs_percent: initialData?.default_carbs_percent?.toString() || '40',
    default_fat_percent: initialData?.default_fat_percent?.toString() || '25',
    weight_measurement_frequency: initialData?.weight_measurement_frequency || 'biweekly',
    physique_frequency: initialData?.physique_frequency || 'biweekly',
    allow_client_weight_checkin: initialData?.allow_client_weight_checkin ?? true,
    allow_client_physique_checkin: initialData?.allow_client_physique_checkin ?? true,
    coach_id: initialData?.coach_id || '',
    challenge_info: initialData?.challenge_info || '',
  });

  const [challengeImageUrl, setChallengeImageUrl] = useState<string | null>(initialData?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [coaches, setCoaches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      // Fetch coaches from profiles where they have coach role
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        // Filter for coaches/admins - this is a simplified version
        // In a real implementation, you'd check roles
        setCoaches([]);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };

  const handleImageSelect = (file: File) => {
    setChallengeImageUrl(null);
    setPendingImageFile(null);
    delete (window as any).pendingImageFile;
    setPendingImageFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropper(false);
    setUploadingImage(true);

    try {
      const originalDimensions = await getImageDimensions(croppedFile);
      const resizedFile = await resizeImage(croppedFile, 1920, 1080, 0.85);

      (window as any).pendingImageFile = resizedFile;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setChallengeImageUrl(result);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    const startDate = new Date(formData.start_at);
    const endDate = new Date(formData.end_at);
    if (endDate < startDate) {
      newErrors.end_at = 'End date must be on or after start date';
    }

    const protein = parseFloat(formData.default_protein_percent) || 0;
    const carbs = parseFloat(formData.default_carbs_percent) || 0;
    const fat = parseFloat(formData.default_fat_percent) || 0;
    const sum = Math.round((protein + carbs + fat) * 100) / 100;
    if (sum !== 100) {
      newErrors.macros = 'Macro percentages must sum to 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const startDateTime = new Date(`${formData.start_at}T00:00:00`).toISOString();
      const endDateTime = new Date(`${formData.end_at}T23:59:59`).toISOString();

      const payload: any = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        start_at: startDateTime,
        end_at: endDateTime,
        default_min_steps: formData.default_min_steps ? parseInt(formData.default_min_steps) : null,
        calorie_multiplier: formData.calorie_multiplier ? parseFloat(formData.calorie_multiplier) : 15,
        default_protein_percent: formData.default_protein_percent ? parseFloat(formData.default_protein_percent) : null,
        default_carbs_percent: formData.default_carbs_percent ? parseFloat(formData.default_carbs_percent) : null,
        default_fat_percent: formData.default_fat_percent ? parseFloat(formData.default_fat_percent) : null,
        weight_measurement_frequency: formData.weight_measurement_frequency || null,
        physique_frequency: formData.physique_frequency || null,
        allow_client_weight_checkin: formData.allow_client_weight_checkin,
        allow_client_physique_checkin: formData.allow_client_physique_checkin,
        coach_id: formData.coach_id || null,
        challenge_info: formData.challenge_info?.trim() || null,
        // Button texts are auto-set in the app, so we don't need to send them
        approve_button_text: null,
        decline_button_text: null,
      };

      let imageUrl = formData.image_url;

      // Upload image if there's a pending file
      if ((window as any).pendingImageFile) {
        const imageFile = (window as any).pendingImageFile;
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);
        formDataImage.append('type', 'challenge');

        const uploadResponse = await fetch('/api/admin/challenges/upload-image', {
          method: 'POST',
          body: formDataImage,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        }
      }

      payload.image_url = imageUrl;

      const url = isEditing
        ? `/api/admin/challenges/${challengeId}`
        : '/api/admin/challenges';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save challenge');
      }

      const data = await response.json();
      router.push(`/admin/challenges/${data.challenge.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error saving challenge:', error);
      alert(error.message || 'Failed to save challenge');
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
          {isEditing ? 'Edit Challenge' : 'Create Challenge'}
        </h2>

        {/* Basic Information */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Basic Information
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: errors.title ? '1px solid #FF3B30' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '15px',
              }}
            />
            {errors.title && (
              <p style={{ marginTop: '4px', fontSize: '13px', color: '#FF3B30' }}>{errors.title}</p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: errors.end_at ? '1px solid #FF3B30' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                }}
              />
              {errors.end_at && (
                <p style={{ marginTop: '4px', fontSize: '13px', color: '#FF3B30' }}>{errors.end_at}</p>
              )}
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Default Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                Minimum Steps
              </label>
              <input
                type="number"
                value={formData.default_min_steps}
                onChange={(e) => setFormData({ ...formData, default_min_steps: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                Calorie Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.calorie_multiplier}
                onChange={(e) => setFormData({ ...formData, calorie_multiplier: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              Default Macros (%)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Protein
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.default_protein_percent}
                  onChange={(e) => setFormData({ ...formData, default_protein_percent: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Carbs
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.default_carbs_percent}
                  onChange={(e) => setFormData({ ...formData, default_carbs_percent: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Fat
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.default_fat_percent}
                  onChange={(e) => setFormData({ ...formData, default_fat_percent: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                  }}
                />
              </div>
            </div>
            {errors.macros && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#FF3B30' }}>{errors.macros}</p>
            )}
          </div>
        </div>

        {/* Check-in Settings */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Check-in Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                Weight Measurement Frequency
              </label>
              <select
                value={formData.weight_measurement_frequency}
                onChange={(e) => setFormData({ ...formData, weight_measurement_frequency: e.target.value as CheckInFrequency })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                }}
              >
                <option value="">None</option>
                {CHECK_IN_FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
                Physique Frequency
              </label>
              <select
                value={formData.physique_frequency}
                onChange={(e) => setFormData({ ...formData, physique_frequency: e.target.value as CheckInFrequency })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                }}
              >
                <option value="">None</option>
                {CHECK_IN_FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#FFFFFF', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.allow_client_weight_checkin}
                onChange={(e) => setFormData({ ...formData, allow_client_weight_checkin: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Allow clients to submit weight check-ins
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#FFFFFF', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.allow_client_physique_checkin}
                onChange={(e) => setFormData({ ...formData, allow_client_physique_checkin: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Allow clients to submit physique check-ins
            </label>
          </div>
        </div>

        {/* Additional Information */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Additional Information
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              Challenge Info (Markdown)
            </label>
            <textarea
              value={formData.challenge_info}
              onChange={(e) => setFormData({ ...formData, challenge_info: e.target.value })}
              rows={15}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontFamily: '"SF Mono", "Monaco", "Courier New", monospace',
                resize: 'vertical',
                lineHeight: '24px',
              }}
              placeholder="Enter challenge information using Markdown. Markdown will be converted to HTML when you save."
            />
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>
              Enter markdown text here. Use * for bold, _ for italic, # for headings, etc. Markdown will be converted to formatted HTML when you save.
            </p>
          </div>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Challenge Image
          </h3>

          {challengeImageUrl && (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={challengeImageUrl}
                alt="Challenge preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageSelect(file);
            }}
            style={{ display: 'none' }}
            id="challenge-image-upload"
          />
          <label
            htmlFor="challenge-image-upload"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            {uploadingImage ? 'Uploading...' : challengeImageUrl ? 'Change Image' : 'Upload Image'}
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? 'rgba(0, 122, 255, 0.5)' : '#007AFF',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Challenge'}
          </button>
        </div>
      </div>

      {showCropper && pendingImageFile && (
        <ImageCropper
          imageFile={pendingImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

