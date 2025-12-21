'use client';

import { useState } from 'react';

interface WorkoutListProps {
  workouts: any[];
  assignedWorkouts: any[];
  userId: string;
}

export default function WorkoutList({
  workouts,
  assignedWorkouts,
  userId,
}: WorkoutListProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssignWorkout = async () => {
    if (!selectedWorkoutId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/workout-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: selectedWorkoutId,
          assigned_to_user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign workout');
      }

      setShowAssignModal(false);
      setSelectedWorkoutId('');
      window.location.reload();
    } catch (error) {
      console.error('Error assigning workout:', error);
      alert('Failed to assign workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px' }}>Workouts</h2>
        <button
          onClick={() => setShowAssignModal(true)}
          className="button button-primary"
          style={{ fontSize: '15px', padding: '10px 20px' }}
        >
          Assign Workout
        </button>
      </div>

      {showAssignModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px' }}>Assign Workout</h3>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)', marginBottom: '16px' }}>
              Workout assignment functionality - to be implemented with workout selection
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAssignModal(false)}
                className="button button-secondary"
                style={{ fontSize: '15px', padding: '10px 20px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '17px' }}>Created Workouts</h3>
        {workouts.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No workouts created</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workouts.map((workout) => (
              <div key={workout.id} className="card">
                <h4 style={{ marginBottom: '8px', fontSize: '17px' }}>{workout.name}</h4>
                {workout.description && (
                  <p
                    style={{
                      color: 'rgba(235, 235, 245, 0.6)',
                      fontSize: '15px',
                      marginBottom: '8px',
                    }}
                  >
                    {workout.description}
                  </p>
                )}
                <div style={{ fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
                  <div>Visibility: {workout.visibility}</div>
                  <div>Template: {workout.is_template ? 'Yes' : 'No'}</div>
                  <div>Created: {new Date(workout.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '17px' }}>Assigned Workouts</h3>
        {assignedWorkouts.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No assigned workouts</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignedWorkouts.map((assignment) => {
              const workout = assignment.assigned_workout || assignment.workout;
              return (
                <div key={assignment.id} className="card">
                  <h4 style={{ marginBottom: '8px', fontSize: '17px' }}>
                    {workout?.name || 'Unknown Workout'}
                  </h4>
                  {workout?.description && (
                    <p
                      style={{
                        color: 'rgba(235, 235, 245, 0.6)',
                        fontSize: '15px',
                        marginBottom: '8px',
                      }}
                    >
                      {workout.description}
                    </p>
                  )}
                  <div style={{ fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
                    <div>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</div>
                    {assignment.notes && <div>Notes: {assignment.notes}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




