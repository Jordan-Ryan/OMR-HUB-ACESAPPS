'use client';

import { useState, useEffect } from 'react';

interface DailyCheckin {
  id: string;
  enrollment_id: string;
  date: string;
  workout_completed: boolean;
  workout_type: string | null;
  steps: number | null;
  calories_consumed: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  workout_screenshot_url: string | null;
  steps_screenshot_url: string | null;
  macros_screenshot_url: string | null;
  workout_details?: any;
}

interface Enrollment {
  calculated_calories: number | null;
  protein_percent: number | null;
  carbs_percent: number | null;
  fat_percent: number | null;
  min_steps: number | null;
}

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  userId: string;
  date: string;
  enrollment: Enrollment | null;
}

export function DayDetailModal({
  isOpen,
  onClose,
  challengeId,
  userId,
  date,
  enrollment,
}: DayDetailModalProps) {
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRedDay, setIsRedDay] = useState(false);

  useEffect(() => {
    if (isOpen && date) {
      fetchDayDetail();
    }
  }, [isOpen, date, challengeId, userId]);

  const fetchDayDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/challenges/${challengeId}/participants/${userId}/daily/${date}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch day detail');
      }

      const data = await response.json();
      setCheckin(data.checkin);
      setIsRedDay(data.isRedDay || false);
    } catch (error) {
      console.error('Error fetching day detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const targetCalories = enrollment?.calculated_calories || 0;
  const targetProtein = enrollment?.protein_percent ? (targetCalories * enrollment.protein_percent / 100) / 4 : 0;
  const targetCarbs = enrollment?.carbs_percent ? (targetCalories * enrollment.carbs_percent / 100) / 4 : 0;
  const targetFat = enrollment?.fat_percent ? (targetCalories * enrollment.fat_percent / 100) / 9 : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
            {formatDate(date)}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading...
          </div>
        ) : !checkin ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px' }}>
              No check-in data for this day.
            </p>
            {isRedDay && (
              <p style={{ color: '#FF3B30', fontSize: '14px' }}>
                This is marked as a red day.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Steps */}
            {checkin.steps !== null && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                  Steps
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
                    {checkin.steps.toLocaleString()}
                  </span>
                  {enrollment?.min_steps && (
                    <span
                      style={{
                        fontSize: '14px',
                        color: checkin.steps >= enrollment.min_steps ? '#34C759' : '#FF3B30',
                      }}
                    >
                      Goal: {enrollment.min_steps.toLocaleString()}
                    </span>
                  )}
                </div>
                {checkin.steps_screenshot_url && (
                  <img
                    src={checkin.steps_screenshot_url}
                    alt="Steps screenshot"
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Calories */}
            {checkin.calories_consumed !== null && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                  Calories
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
                    {checkin.calories_consumed}
                  </span>
                  {targetCalories > 0 && (
                    <span
                      style={{
                        fontSize: '14px',
                        color: Math.abs(checkin.calories_consumed - targetCalories) / targetCalories <= 0.1
                          ? '#34C759'
                          : '#FF3B30',
                      }}
                    >
                      Target: {targetCalories}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Macros */}
            {(checkin.protein_g !== null || checkin.carbs_g !== null || checkin.fat_g !== null) && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                  Macros
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {checkin.protein_g !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Protein:</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                          {checkin.protein_g.toFixed(1)}g
                        </span>
                        {targetProtein > 0 && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: Math.abs(checkin.protein_g - targetProtein) / targetProtein <= 0.1
                                ? '#34C759'
                                : '#FF3B30',
                            }}
                          >
                            (Target: {targetProtein.toFixed(1)}g)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {checkin.carbs_g !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Carbs:</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                          {checkin.carbs_g.toFixed(1)}g
                        </span>
                        {targetCarbs > 0 && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: Math.abs(checkin.carbs_g - targetCarbs) / targetCarbs <= 0.1
                                ? '#34C759'
                                : '#FF3B30',
                            }}
                          >
                            (Target: {targetCarbs.toFixed(1)}g)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {checkin.fat_g !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Fat:</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                          {checkin.fat_g.toFixed(1)}g
                        </span>
                        {targetFat > 0 && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: Math.abs(checkin.fat_g - targetFat) / targetFat <= 0.1
                                ? '#34C759'
                                : '#FF3B30',
                            }}
                          >
                            (Target: {targetFat.toFixed(1)}g)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {checkin.macros_screenshot_url && (
                  <img
                    src={checkin.macros_screenshot_url}
                    alt="Macros screenshot"
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Workout */}
            {checkin.workout_completed && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                  Workout
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {checkin.workout_type && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Type: </span>
                      <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{checkin.workout_type}</span>
                    </div>
                  )}
                  {checkin.workout_details && Array.isArray(checkin.workout_details) && checkin.workout_details.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>Workout Details:</div>
                      {checkin.workout_details.map((detail: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '6px',
                            marginBottom: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {detail.name && <div style={{ color: '#FFFFFF', fontWeight: '600' }}>{detail.name}</div>}
                          {detail.duration && (
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Duration: {Math.floor(detail.duration / 60)}m {detail.duration % 60}s
                            </div>
                          )}
                          {detail.activeCalories && (
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Calories: {detail.activeCalories}
                            </div>
                          )}
                          {detail.distance && (
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Distance: {(detail.distance / 1000).toFixed(2)}km
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {checkin.workout_screenshot_url && (
                  <img
                    src={checkin.workout_screenshot_url}
                    alt="Workout screenshot"
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Red Day Notice */}
            {isRedDay && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 59, 48, 0.2)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 59, 48, 0.4)',
                  color: '#FF3B30',
                  fontSize: '14px',
                }}
              >
                This day is marked as a red day.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


