'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SearchInput from './SearchInput';
import FilterBar, { FilterConfig } from './FilterBar';
import StatusBadge from './StatusBadge';
import { CalendarIcon, ClipboardIcon, DumbbellIcon } from '@/components/icons/AdminIcons';

interface Workout {
  id: string;
  name: string;
  description?: string | null;
  visibility: 'private' | 'public' | 'coach';
  is_template?: boolean;
  created_at: string;
  exercises?: Array<{
    id: string;
    exercise_id: string;
    order_index: number;
  }>;
}

interface WorkoutManagementListProps {
  showCreateButton?: boolean;
}

export default function WorkoutManagementList({ showCreateButton = false }: WorkoutManagementListProps = {}) {
  const searchParams = useSearchParams();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'coach' | 'public' | 'private'>(
    (searchParams.get('filter') as 'all' | 'coach' | 'public' | 'private') || 'all'
  );

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter && ['all', 'coach', 'public', 'private'].includes(filter)) {
      setVisibilityFilter(filter as 'all' | 'coach' | 'public' | 'private');
    }
  }, [searchParams]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/workouts');
      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }
      const data = await response.json();
      setWorkouts(data.workouts || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((workout) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        workout.name?.toLowerCase().includes(searchLower) ||
        workout.description?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Visibility filter
      if (visibilityFilter !== 'all' && workout.visibility !== visibilityFilter) {
        return false;
      }

      return true;
    });
  }, [workouts, searchTerm, visibilityFilter]);

  const getWorkoutStats = (workout: Workout) => {
    const exerciseCount = workout.exercises?.length || 0;
    return { exerciseCount };
  };

  // Visibility filter is now handled by sub-navigation tabs
  const filterConfigs: FilterConfig[] = [];
  const clearFilters = () => {
    setVisibilityFilter('all');
  };

  if (loading) {
    return (
      <div style={{ color: '#FFFFFF', padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading workouts...</div>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          Please wait while we fetch the data
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Create Button */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <SearchInput
          placeholder="Search workouts..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ maxWidth: '500px', flex: '1', minWidth: '200px' }}
        />
        
        {/* Create Workout Button */}
        {showCreateButton && (
          <a
            href="/admin/coach/workouts/create"
            className="button button-primary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
              textDecoration: 'none',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            Create Workout
          </a>
        )}
      </div>

      {/* Workouts List */}
      {filteredWorkouts.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '64px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ marginBottom: '16px', color: '#FFFFFF' }}>
            <DumbbellIcon width={48} height={48} strokeWidth={1.4} />
          </div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#FFFFFF',
            }}
          >
            {searchTerm || visibilityFilter !== 'all'
              ? 'No workouts found'
              : 'No workouts found'}
          </h3>
          <p style={{ color: 'rgba(235, 235, 245, 0.6)', marginBottom: '24px' }}>
            {searchTerm || visibilityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first workout to get started'}
          </p>
          {!searchTerm && visibilityFilter === 'all' && (
            <Link
              href="/admin/coach/workouts/create"
              className="button button-primary"
              style={{ fontSize: '15px', padding: '12px 24px' }}
            >
              Create Workout
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredWorkouts.map((workout) => {
              const stats = getWorkoutStats(workout);
              const visibilityBadge =
                workout.visibility === 'coach'
                  ? 'COACH'
                  : workout.visibility === 'public'
                  ? 'PUBLIC'
                  : 'PRIVATE';
              const badgeVariant =
                workout.visibility === 'coach'
                  ? 'warning'
                  : workout.visibility === 'public'
                  ? 'info'
                  : 'default';

              return (
                <Link
                  key={workout.id}
                  href={`/admin/coach/workouts/${workout.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="card"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: '#1a1a1a',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '20px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.3)';
                      e.currentTarget.style.boxShadow =
                        '0 8px 32px rgba(0, 122, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        gap: '16px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {workout.visibility !== 'private' && (
                            <StatusBadge status={visibilityBadge} variant={badgeVariant} />
                          )}
                          {workout.is_template && (
                            <StatusBadge status="TEMPLATE" variant="warning" />
                          )}
                        </div>
                        <h3
                          style={{
                            marginBottom: '8px',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#FFFFFF',
                          }}
                        >
                          {workout.name}
                        </h3>
                        {workout.description && (
                          <p
                            style={{
                              color: 'rgba(235, 235, 245, 0.6)',
                              fontSize: '15px',
                              marginBottom: '12px',
                              lineHeight: '20px',
                            }}
                          >
                            {workout.description}
                          </p>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            gap: '20px',
                            fontSize: '14px',
                            color: 'rgba(235, 235, 245, 0.6)',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}>
                              <ClipboardIcon width={16} height={16} />
                            </span>
                            <span>
                              <strong style={{ color: '#FFFFFF' }}>{stats.exerciseCount}</strong>{' '}
                              {stats.exerciseCount === 1 ? 'Exercise' : 'Exercises'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}>
                              <CalendarIcon width={16} height={16} />
                            </span>
                            <span>
                              Created{' '}
                              {new Date(workout.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'rgba(255, 255, 255, 0.3)',
                          fontSize: '24px',
                        }}
                      >
                        ›
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
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
            Showing <strong style={{ color: '#FFFFFF' }}>{filteredWorkouts.length}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{workouts.length}</strong> workouts
          </div>
        </>
      )}
    </div>
  );
}
