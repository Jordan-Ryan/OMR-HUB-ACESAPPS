'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExerciseFormProps {
  exerciseId?: string;
}

export default function ExerciseForm({ exerciseId }: ExerciseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingMale, setUploadingMale] = useState(false);
  const [uploadingFemale, setUploadingFemale] = useState(false);
  const [maleVideoFile, setMaleVideoFile] = useState<File | null>(null);
  const [femaleVideoFile, setFemaleVideoFile] = useState<File | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [maleVideoUrl, setMaleVideoUrl] = useState<string | null>(null);
  const [femaleVideoUrl, setFemaleVideoUrl] = useState<string | null>(null);
  const [loadingMaleVideo, setLoadingMaleVideo] = useState(false);
  const [loadingFemaleVideo, setLoadingFemaleVideo] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exercise_group_id: '',
    gender: 'both',
    video_url_male: '',
    video_url_female: '',
    thumbnail_url: '',
    muscle_groups: [] as string[],
    equipment_needed: [] as string[],
    difficulty_level: '',
    exercise_type: 'strength',
  });

  useEffect(() => {
    if (exerciseId) {
      fetchExercise();
    }
  }, [exerciseId]);

  // Create preview URLs for newly selected files
  useEffect(() => {
    if (maleVideoFile) {
      const url = URL.createObjectURL(maleVideoFile);
      setMaleVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [maleVideoFile]);

  useEffect(() => {
    if (femaleVideoFile) {
      const url = URL.createObjectURL(femaleVideoFile);
      setFemaleVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [femaleVideoFile]);

  // Fetch signed URLs for videos when editing (only if no new file is selected)
  useEffect(() => {
    const fetchVideoUrls = async () => {
      if (!exerciseId) return;

      // Only fetch if no new file is selected
      if (formData.video_url_male && !maleVideoFile) {
        setLoadingMaleVideo(true);
        try {
          const response = await fetch(`/api/admin/exercises/video-url?path=${encodeURIComponent(formData.video_url_male)}`);
          const data = await response.json();
          if (data.url) {
            setMaleVideoUrl(data.url);
          } else {
            setMaleVideoUrl(null);
          }
        } catch (error) {
          console.error('Error fetching male video URL:', error);
          setMaleVideoUrl(null);
        } finally {
          setLoadingMaleVideo(false);
        }
      } else if (!maleVideoFile && !formData.video_url_male) {
        setMaleVideoUrl(null);
      }

      if (formData.video_url_female && !femaleVideoFile) {
        setLoadingFemaleVideo(true);
        try {
          const response = await fetch(`/api/admin/exercises/video-url?path=${encodeURIComponent(formData.video_url_female)}`);
          const data = await response.json();
          if (data.url) {
            setFemaleVideoUrl(data.url);
          } else {
            setFemaleVideoUrl(null);
          }
        } catch (error) {
          console.error('Error fetching female video URL:', error);
          setFemaleVideoUrl(null);
        } finally {
          setLoadingFemaleVideo(false);
        }
      } else if (!femaleVideoFile && !formData.video_url_female) {
        setFemaleVideoUrl(null);
      }

      // Auto-select gender based on available videos
      if (maleVideoFile || (formData.video_url_male && !femaleVideoFile && !formData.video_url_female)) {
        setSelectedGender('male');
      } else if (femaleVideoFile || (formData.video_url_female && !maleVideoFile && !formData.video_url_male)) {
        setSelectedGender('female');
      }
    };

    fetchVideoUrls();
  }, [exerciseId, formData.video_url_male, formData.video_url_female, maleVideoFile, femaleVideoFile]);

  const fetchExercise = async () => {
    try {
      const response = await fetch(`/api/admin/exercises/${exerciseId}`);
      const data = await response.json();
      if (data.exercise) {
        setFormData({
          title: data.exercise.title || '',
          description: data.exercise.description || '',
          exercise_group_id: data.exercise.exercise_group_id || '',
          gender: data.exercise.gender || 'both',
          video_url_male: data.exercise.video_url_male || '',
          video_url_female: data.exercise.video_url_female || '',
          thumbnail_url: data.exercise.thumbnail_url || '',
          muscle_groups: data.exercise.muscle_groups || [],
          equipment_needed: data.exercise.equipment_needed || [],
          difficulty_level: data.exercise.difficulty_level || '',
          exercise_type: data.exercise.exercise_type || 'strength',
        });
      }
    } catch (error) {
      console.error('Error fetching exercise:', error);
    }
  };

  const uploadVideo = async (file: File, exerciseId: string, gender: 'male' | 'female'): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('exerciseId', exerciseId);
    formData.append('gender', gender);

    const response = await fetch('/api/admin/exercises/upload-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload video');
    }

    const data = await response.json();
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, create or update the exercise
      const url = exerciseId
        ? `/api/admin/exercises/${exerciseId}`
        : '/api/admin/exercises';
      const method = exerciseId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercise');
      }

      const exerciseData = await response.json();
      const currentExerciseId = exerciseId || exerciseData.exercise?.id;

      if (!currentExerciseId) {
        throw new Error('Failed to get exercise ID');
      }

      // Upload videos if files are selected
      let maleVideoPath: string | null = formData.video_url_male || null;
      let femaleVideoPath: string | null = formData.video_url_female || null;

      if (maleVideoFile) {
        setUploadingMale(true);
        try {
          const uploadedPath = await uploadVideo(maleVideoFile, currentExerciseId, 'male');
          if (uploadedPath) {
            maleVideoPath = uploadedPath;
          }
        } catch (error: any) {
          console.error('Error uploading male video:', error);
          alert(`Failed to upload male video: ${error.message}`);
          setUploadingMale(false);
          setLoading(false);
          return;
        }
        setUploadingMale(false);
      }

      if (femaleVideoFile) {
        setUploadingFemale(true);
        try {
          const uploadedPath = await uploadVideo(femaleVideoFile, currentExerciseId, 'female');
          if (uploadedPath) {
            femaleVideoPath = uploadedPath;
          }
        } catch (error: any) {
          console.error('Error uploading female video:', error);
          alert(`Failed to upload female video: ${error.message}`);
          setUploadingFemale(false);
          setLoading(false);
          return;
        }
        setUploadingFemale(false);
      }

      // Update exercise with video paths if videos were uploaded
      if (maleVideoFile || femaleVideoFile) {
        const updateResponse = await fetch(`/api/admin/exercises/${currentExerciseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            video_url_male: maleVideoPath || formData.video_url_male,
            video_url_female: femaleVideoPath || formData.video_url_female,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update exercise with video paths');
        }
      }

      router.push('/admin/coach/exercises');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving exercise:', error);
      alert(error.message || 'Failed to save exercise');
    } finally {
      setLoading(false);
      setUploadingMale(false);
      setUploadingFemale(false);
    }
  };

  const addArrayItem = (field: 'muscle_groups' | 'equipment_needed', value: string) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value.trim()],
      });
    }
  };

  const removeArrayItem = (field: 'muscle_groups' | 'equipment_needed', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px' }}>Exercise Details</h2>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Exercise Type
            </label>
            <select
              value={formData.exercise_type}
              onChange={(e) =>
                setFormData({ ...formData, exercise_type: e.target.value })
              }
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
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(235, 235, 245, 0.6)',
                fontSize: '15px',
              }}
            >
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
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
              <option value="both">Both</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Difficulty Level
          </label>
          <select
            value={formData.difficulty_level}
            onChange={(e) =>
              setFormData({ ...formData, difficulty_level: e.target.value })
            }
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
            <option value="">Select difficulty...</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Video Preview Section */}
        {((maleVideoUrl || maleVideoFile) || (femaleVideoUrl || femaleVideoFile)) && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  color: 'rgba(235, 235, 245, 0.6)',
                  fontSize: '15px',
                }}
              >
                Video Preview
              </label>
              {(maleVideoUrl || maleVideoFile) && (femaleVideoUrl || femaleVideoFile) && (
                <div style={{ display: 'flex', gap: '8px', background: '#1C1C1E', padding: '4px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedGender('male')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedGender === 'male' ? '#007AFF' : 'transparent',
                      color: selectedGender === 'male' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGender('female')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedGender === 'female' ? '#007AFF' : 'transparent',
                      color: selectedGender === 'female' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Female
                  </button>
                </div>
              )}
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: '#000000',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(84, 84, 88, 0.65)',
              }}
            >
              {selectedGender === 'male' ? (
                loadingMaleVideo ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(235, 235, 245, 0.6)' }}>
                    Loading video...
                  </div>
                ) : maleVideoUrl ? (
                  <video
                    key={maleVideoUrl} // Force re-render when URL changes
                    src={maleVideoUrl}
                    controls
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(235, 235, 245, 0.6)' }}>
                    No male video available
                  </div>
                )
              ) : (
                loadingFemaleVideo ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(235, 235, 245, 0.6)' }}>
                    Loading video...
                  </div>
                ) : femaleVideoUrl ? (
                  <video
                    key={femaleVideoUrl} // Force re-render when URL changes
                    src={femaleVideoUrl}
                    controls
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(235, 235, 245, 0.6)' }}>
                    No female video available
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Video (Male) {uploadingMale && <span style={{ color: '#007AFF' }}>Uploading...</span>}
          </label>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/m4v"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Validate file size (50MB)
                if (file.size > 50 * 1024 * 1024) {
                  alert('File size exceeds 50MB limit');
                  e.target.value = '';
                  return;
                }
                setMaleVideoFile(file);
                setSelectedGender('male'); // Switch to male video when new file is selected
              }
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
            }}
          />
          {maleVideoFile && (
            <p style={{ marginTop: '8px', fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
              Selected: {maleVideoFile.name} ({(maleVideoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {formData.video_url_male && !maleVideoFile && (
            <p style={{ marginTop: '8px', fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
              Current: {formData.video_url_male}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Video (Female) {uploadingFemale && <span style={{ color: '#007AFF' }}>Uploading...</span>}
          </label>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/m4v"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Validate file size (50MB)
                if (file.size > 50 * 1024 * 1024) {
                  alert('File size exceeds 50MB limit');
                  e.target.value = '';
                  return;
                }
                setFemaleVideoFile(file);
                setSelectedGender('female'); // Switch to female video when new file is selected
              }
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
            }}
          />
          {femaleVideoFile && (
            <p style={{ marginTop: '8px', fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
              Selected: {femaleVideoFile.name} ({(femaleVideoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {formData.video_url_female && !femaleVideoFile && (
            <p style={{ marginTop: '8px', fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
              Current: {formData.video_url_female}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Thumbnail URL
          </label>
          <input
            type="url"
            value={formData.thumbnail_url}
            onChange={(e) =>
              setFormData({ ...formData, thumbnail_url: e.target.value })
            }
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2c2c2e',
              border: '1px solid rgba(84, 84, 88, 0.65)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '17px',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="button button-secondary"
          style={{ fontSize: '15px', padding: '12px 24px' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="button button-primary"
          style={{
            fontSize: '15px',
            padding: '12px 24px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : exerciseId ? 'Update Exercise' : 'Create Exercise'}
        </button>
      </div>
    </form>
  );
}

