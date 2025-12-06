'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchInput from './SearchInput';

interface Exercise {
  id: string;
  title: string;
  exercise_type: string | null;
  muscle_groups: string[] | null;
  description?: string | null;
  gender?: string | null;
  difficulty_level?: string | null;
}

export default function ExerciseList() {
  const searchParams = useSearchParams();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const muscleGroupFilter = searchParams.get('muscle_group');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/exercises');
      if (!response.ok) {
        throw new Error('Failed to fetch exercises');
      }
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      exercise.title?.toLowerCase().includes(searchLower) ||
      exercise.description?.toLowerCase().includes(searchLower) ||
      exercise.exercise_type?.toLowerCase().includes(searchLower) ||
      exercise.muscle_groups?.some((mg: string) =>
        mg.toLowerCase().includes(searchLower)
      );

    if (!matchesSearch) return false;

    // Muscle group filter
    if (muscleGroupFilter && muscleGroupFilter !== 'all') {
      const filterName = muscleGroupFilter.replace(/-/g, ' ').toLowerCase().trim();
      const hasMatchingMuscleGroup = exercise.muscle_groups?.some((mg: string) => {
        const mgNormalized = mg.toLowerCase().trim();
        const mgWithDashes = mgNormalized.replace(/\s+/g, '-');
        return mgNormalized === filterName || mgWithDashes === muscleGroupFilter;
      });
      if (!hasMatchingMuscleGroup) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div style={{ color: '#FFFFFF', padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading exercises...</div>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          Please wait while we fetch the data
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Create Button */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1, maxWidth: '500px' }}>
          <SearchInput
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <a
          href="/admin/coach/exercises/create"
          className="button button-primary"
          style={{
            fontSize: '15px',
            padding: '12px 24px',
            textDecoration: 'none',
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
        >
          Create Exercise
        </a>
      </div>

      {/* Exercises Table */}
      {filteredExercises.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {searchTerm || muscleGroupFilter
            ? 'No exercises found matching your filters.'
            : 'No exercises found.'}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: '#0a0a0a' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#0a0a0a',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#141414',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Muscle Group
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExercises.map((exercise, index) => (
                  <tr
                    key={exercise.id}
                    onClick={() => {
                      window.location.href = `/admin/coach/exercises/${exercise.id}`;
                    }}
                    style={{
                      borderBottom:
                        index < filteredExercises.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: '#0a0a0a',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0a0a0a';
                    }}
                  >
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: '#FFFFFF',
                        fontWeight: '500',
                      }}
                    >
                      {exercise.title}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {exercise.exercise_type || '-'}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0
                        ? exercise.muscle_groups.join(', ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div
            style={{
              marginTop: '24px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              padding: '12px 20px',
              background: '#1a1a1a',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'inline-block',
            }}
          >
            Showing <strong style={{ color: '#FFFFFF' }}>{filteredExercises.length}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{exercises.length}</strong> exercises
          </div>
        </>
      )}
    </div>
  );
}
