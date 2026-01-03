'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TimedChallengeFormProps {
  challengeId: string;
  timedChallengeId?: string;
  initialData?: any;
}

const CHALLENGE_TYPES = [
  { value: 'for_time', label: 'For Time' },
  { value: 'for_distance', label: 'For Distance' },
  { value: 'strength', label: 'Strength' },
  { value: 'max_reps', label: 'Maximum Reps' },
  { value: 'max_rounds', label: 'Maximum Rounds' },
  { value: 'calories', label: 'Calories Burned' },
  { value: 'steps', label: 'Steps' },
];

export default function TimedChallengeForm({
  challengeId,
  timedChallengeId,
  initialData,
}: TimedChallengeFormProps) {
  const router = useRouter();
  const isEditing = !!timedChallengeId;

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    challenge_type: initialData?.challenge_type || '',
    start_date: initialData?.start_date || getTodayDate(),
    end_date: initialData?.end_date || getTodayDate(),
    linked_challenge_id: initialData?.linked_challenge_id || '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableChallenges, setAvailableChallenges] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (formData.challenge_type) {
      fetchAvailableChallenges();
    }
  }, [formData.challenge_type, challengeId]);

  const fetchAvailableChallenges = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}/timed-api`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current challenge if editing
        const filtered = data.challenges
          ?.filter((c: any) => c.id !== timedChallengeId && c.challenge_type === formData.challenge_type)
          .map((c: any) => ({ id: c.id, title: c.title })) || [];
        setAvailableChallenges(filtered);
      }
    } catch (error) {
      console.error('Error fetching available challenges:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.challenge_type) {
      newErrors.challenge_type = 'Challenge type is required';
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    if (endDate < startDate) {
      newErrors.end_date = 'End date must be on or after start date';
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
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        challenge_type: formData.challenge_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        linked_challenge_id: formData.linked_challenge_id || null,
      };

      const url = isEditing
        ? `/api/admin/challenges/${challengeId}/timed-api/${timedChallengeId}`
        : `/api/admin/challenges/${challengeId}/timed-api`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save timed challenge');
      }

      router.push(`/admin/challenges/${challengeId}?tab=timed`);
      router.refresh();
    } catch (error: any) {
      console.error('Error saving timed challenge:', error);
      alert(error.message || 'Failed to save timed challenge');
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
          {isEditing ? 'Edit Timed Challenge' : 'Create Timed Challenge'}
        </h2>

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

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
            Challenge Type *
          </label>
          <select
            value={formData.challenge_type}
            onChange={(e) => setFormData({ ...formData, challenge_type: e.target.value, linked_challenge_id: '' })}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: errors.challenge_type ? '1px solid #FF3B30' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '15px',
            }}
          >
            <option value="">Select a type</option>
            {CHALLENGE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.challenge_type && (
            <p style={{ marginTop: '4px', fontSize: '13px', color: '#FF3B30' }}>{errors.challenge_type}</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              Start Date *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: errors.end_date ? '1px solid #FF3B30' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '15px',
              }}
            />
            {errors.end_date && (
              <p style={{ marginTop: '4px', fontSize: '13px', color: '#FF3B30' }}>{errors.end_date}</p>
            )}
          </div>
        </div>

        {formData.challenge_type && availableChallenges.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>
              Link to Previous Challenge (Optional)
            </label>
            <select
              value={formData.linked_challenge_id}
              onChange={(e) => setFormData({ ...formData, linked_challenge_id: e.target.value })}
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
              {availableChallenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
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
            }}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}

