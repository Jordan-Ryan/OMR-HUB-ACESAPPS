'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WorkoutFormProps {
  workoutId?: string;
}

export default function WorkoutForm({ workoutId }: WorkoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    is_template: false,
  });

  useEffect(() => {
    fetchAvailableExercises();
    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId]);

  const fetchAvailableExercises = async () => {
    try {
      const response = await fetch('/api/admin/exercises');
      const data = await response.json();
      setAvailableExercises(data.exercises || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`/api/admin/workouts/${workoutId}`);
      const data = await response.json();
      if (data.workout) {
        setFormData({
          name: data.workout.name || '',
          description: data.workout.description || '',
          visibility: data.workout.visibility || 'private',
          is_template: data.workout.is_template || false,
        });
        setExercises(
          data.workout.exercises?.map((ex: any) => ({
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
          })) || []
        );
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = workoutId
        ? `/api/admin/workouts/${workoutId}`
        : '/api/admin/workouts';
      const method = workoutId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          exercises,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save workout');
      }

      router.push('/admin/coach/workouts');
      router.refresh();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        exercise_id: '',
        order_index: exercises.length,
        sets: null,
        reps: null,
        weight: null,
        rest_seconds: null,
        notes: '',
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px' }}>Workout Details</h2>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            Visibility
          </label>
          <select
            value={formData.visibility}
            onChange={(e) =>
              setFormData({ ...formData, visibility: e.target.value })
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
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="coach">Coach</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
            }}
          >
            <input
              type="checkbox"
              checked={formData.is_template}
              onChange={(e) =>
                setFormData({ ...formData, is_template: e.target.checked })
              }
            />
            Is Template
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2>Exercises</h2>
          <button
            type="button"
            onClick={addExercise}
            className="button button-secondary"
            style={{ fontSize: '15px', padding: '8px 16px' }}
          >
            Add Exercise
          </button>
        </div>

        {exercises.length === 0 ? (
          <p style={{ color: 'rgba(235, 235, 245, 0.6)', textAlign: 'center' }}>
            No exercises added. Click "Add Exercise" to add one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {exercises.map((exercise, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  background: '#2c2c2e',
                  borderRadius: '8px',
                  border: '1px solid rgba(84, 84, 88, 0.65)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '17px' }}>Exercise {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FF3B30',
                      cursor: 'pointer',
                      fontSize: '15px',
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '13px',
                      }}
                    >
                      Exercise *
                    </label>
                    <select
                      value={exercise.exercise_id}
                      onChange={(e) =>
                        updateExercise(index, 'exercise_id', e.target.value)
                      }
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    >
                      <option value="">Select exercise...</option>
                      {availableExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '13px',
                      }}
                    >
                      Sets
                    </label>
                    <input
                      type="number"
                      value={exercise.sets || ''}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          'sets',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '13px',
                      }}
                    >
                      Reps
                    </label>
                    <input
                      type="number"
                      value={exercise.reps || ''}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          'reps',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '13px',
                      }}
                    >
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={exercise.weight || ''}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          'weight',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '13px',
                      }}
                    >
                      Rest (seconds)
                    </label>
                    <input
                      type="number"
                      value={exercise.rest_seconds || ''}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          'rest_seconds',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#1C1C1E',
                        border: '1px solid rgba(84, 84, 88, 0.65)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          {loading ? 'Saving...' : workoutId ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </form>
  );
}




