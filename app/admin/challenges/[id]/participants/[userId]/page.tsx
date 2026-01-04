'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ParticipantCalendarView } from '@/components/admin/ParticipantCalendarView';
import { ParticipantCharts } from '@/components/admin/ParticipantCharts';
import { DayDetailModal } from '@/components/admin/DayDetailModal';

interface Enrollment {
  id: string;
  user_id: string;
  status: 'pending' | 'onboarded';
  bodyweight_kg: number | null;
  calculated_calories: number | null;
  protein_percent: number | null;
  carbs_percent: number | null;
  fat_percent: number | null;
  min_steps: number | null;
  fitness_level: string;
  enrolled_at: string;
  start_date?: string | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
}

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
}

interface RedDay {
  id: string;
  enrollment_id: string;
  start_date: string;
  end_date: string;
}

interface WeightCheckin {
  id: string;
  enrollment_id: string;
  check_in_number: number;
  weight_kg: number | null;
  submitted_at: string;
}

interface Challenge {
  id: string;
  start_at: string;
  end_at: string;
}

export default function ParticipantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = params.id as string;
  const userId = params.userId as string;
  const selectedDate = searchParams.get('date');

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [redDays, setRedDays] = useState<RedDay[]>([]);
  const [weightCheckins, setWeightCheckins] = useState<WeightCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  useEffect(() => {
    if (challengeId && userId) {
      fetchData();
    }
  }, [challengeId, userId]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedDayDate(selectedDate);
      setShowDayModal(true);
    }
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch challenge
      const challengeResponse = await fetch(`/api/admin/challenges/${challengeId}`);
      if (challengeResponse.ok) {
        const challengeData = await challengeResponse.json();
        setChallenge(challengeData.challenge);
      }

      // Fetch participant check-ins data
      const checkinsResponse = await fetch(`/api/admin/challenges/${challengeId}/participants/${userId}/checkins`);
      if (checkinsResponse.ok) {
        const checkinsData = await checkinsResponse.json();
        setEnrollment(checkinsData.enrollment);
        setDailyCheckins(checkinsData.checkins || []);
        setRedDays(checkinsData.redDays || []);
        setWeightCheckins(checkinsData.weightCheckins || []);
      }
    } catch (error) {
      console.error('Error fetching participant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user?: Enrollment['user']) => {
    if (!user) return 'Unknown User';
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (user.nickname) return user.nickname;
    return 'Unknown User';
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (dailyCheckins.length === 0) {
      return {
        avgSteps: 0,
        avgCalories: 0,
        workoutCompletion: 0,
        totalWorkouts: 0,
        completedWorkouts: 0,
      };
    }

    const totalSteps = dailyCheckins.reduce((sum, c) => sum + (c.steps || 0), 0);
    const totalCalories = dailyCheckins.reduce((sum, c) => sum + (c.calories_consumed || 0), 0);
    const workouts = dailyCheckins.filter(c => c.workout_completed).length;

    return {
      avgSteps: Math.round(totalSteps / dailyCheckins.length),
      avgCalories: Math.round(totalCalories / dailyCheckins.length),
      workoutCompletion: (workouts / dailyCheckins.length) * 100,
      totalWorkouts: dailyCheckins.length,
      completedWorkouts: workouts,
    };
  }, [dailyCheckins]);

  // Get effective values for a date (for macros calculation)
  const getEffectiveValuesForDate = useCallback((date: string) => {
    if (!enrollment) {
      return { calories: 0, macros: null };
    }

    const calories = enrollment.calculated_calories || 0;
    const protein = enrollment.protein_percent ? (calories * enrollment.protein_percent / 100) / 4 : 0;
    const carbs = enrollment.carbs_percent ? (calories * enrollment.carbs_percent / 100) / 4 : 0;
    const fat = enrollment.fat_percent ? (calories * enrollment.fat_percent / 100) / 9 : 0;

    return {
      calories,
      macros: {
        protein,
        carbs,
        fat,
      },
    };
  }, [enrollment]);

  const handleDayClick = (date: string) => {
    setSelectedDayDate(date);
    setShowDayModal(true);
    router.push(`/admin/challenges/${challengeId}/participants/${userId}?date=${date}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setShowDayModal(false);
    setSelectedDayDate(null);
    router.push(`/admin/challenges/${challengeId}/participants/${userId}`, { scroll: false });
  };

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: '48px',
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading participant details...</p>
      </div>
    );
  }

  if (!enrollment || !challenge) {
    return (
      <div
        className="card"
        style={{
          padding: '48px',
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Participant not found</p>
        <Link
          href={`/admin/challenges/${challengeId}/participants`}
          style={{
            display: 'inline-block',
            marginTop: '16px',
            color: '#007AFF',
            textDecoration: 'none',
          }}
        >
          Back to Participants
        </Link>
      </div>
    );
  }

  const challengeStartDate = new Date(challenge.start_at);
  const challengeEndDate = new Date(challenge.end_at);
  const enrollmentStartDate = enrollment.start_date ? new Date(enrollment.start_date) : undefined;

  // Calculate target macros for charts
  const targetCalories = enrollment.calculated_calories || null;
  const targetProtein = enrollment.protein_percent && targetCalories
    ? (targetCalories * enrollment.protein_percent / 100) / 4
    : null;
  const targetCarbs = enrollment.carbs_percent && targetCalories
    ? (targetCalories * enrollment.carbs_percent / 100) / 4
    : null;
  const targetFat = enrollment.fat_percent && targetCalories
    ? (targetCalories * enrollment.fat_percent / 100) / 9
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href={`/admin/challenges/${challengeId}/participants`}
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#007AFF',
            textDecoration: 'none',
            fontSize: '15px',
          }}
        >
          ← Back to Participants
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {enrollment.user?.avatar_url && (
            <img
              src={enrollment.user.avatar_url}
              alt={getUserName(enrollment.user)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
              {getUserName(enrollment.user)}
            </h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: enrollment.status === 'onboarded' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                  color: enrollment.status === 'onboarded' ? '#34C759' : '#FF9500',
                  border: `1px solid ${enrollment.status === 'onboarded' ? 'rgba(52, 199, 89, 0.4)' : 'rgba(255, 149, 0, 0.4)'}`,
                  textTransform: 'capitalize',
                }}
              >
                {enrollment.status}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  textTransform: 'capitalize',
                }}
              >
                {enrollment.fitness_level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
          Overall Stats
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>
              {stats.avgSteps.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>Avg Steps/Day</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>
              {stats.avgCalories}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>Avg Calories/Day</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>
              {Math.round(stats.workoutCompletion)}%
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>Workout Completion</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>
              {stats.completedWorkouts}/{stats.totalWorkouts}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>Workouts Completed</div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {enrollment.status === 'onboarded' && (
        <ParticipantCalendarView
          dailyCheckins={dailyCheckins}
          challengeStartDate={challengeStartDate}
          challengeEndDate={challengeEndDate}
          enrollmentStartDate={enrollmentStartDate}
          stepGoal={enrollment.min_steps || 0}
          getEffectiveValuesForDate={getEffectiveValuesForDate}
          redDays={redDays}
          onDayClick={handleDayClick}
        />
      )}

      {/* Charts */}
      {enrollment.status === 'onboarded' && dailyCheckins.length > 0 && (
        <ParticipantCharts
          dailyCheckins={dailyCheckins}
          weightCheckins={weightCheckins}
          targetCalories={targetCalories}
          targetProtein={targetProtein}
          targetCarbs={targetCarbs}
          targetFat={targetFat}
          stepGoal={enrollment.min_steps}
        />
      )}

      {/* Enrollment Details */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginTop: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
          Enrollment Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Bodyweight</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {enrollment.bodyweight_kg ? `${enrollment.bodyweight_kg} kg` : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Calculated Calories</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {enrollment.calculated_calories ? `${enrollment.calculated_calories} kcal` : 'N/A'}
            </div>
          </div>
          {(enrollment.protein_percent || enrollment.carbs_percent || enrollment.fat_percent) && (
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Macro Split</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                {enrollment.protein_percent?.toFixed(0) || 0}% / {enrollment.carbs_percent?.toFixed(0) || 0}% / {enrollment.fat_percent?.toFixed(0) || 0}%
              </div>
            </div>
          )}
          {enrollment.min_steps && (
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Step Goal</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                {enrollment.min_steps.toLocaleString()} steps/day
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Enrolled</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
          {enrollment.start_date && (
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Start Date</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                {new Date(enrollment.start_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDayDate && (
        <DayDetailModal
          isOpen={showDayModal}
          onClose={handleCloseModal}
          challengeId={challengeId}
          userId={userId}
          date={selectedDayDate}
          enrollment={enrollment}
        />
      )}
    </div>
  );
}


