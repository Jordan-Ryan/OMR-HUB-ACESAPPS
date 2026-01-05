'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ParticipantCalendarView } from '@/components/admin/ParticipantCalendarView';
import { ParticipantCharts } from '@/components/admin/ParticipantCharts';

interface Enrollment {
  id: string;
  user_id: string;
  status: 'pending' | 'onboarded';
  bodyweight_kg: number | null;
  calculated_calories: number | null;
  calorie_adjustment: number | null;
  protein_percent: number | null;
  carbs_percent: number | null;
  fat_percent: number | null;
  min_steps: number | null;
  fitness_level: string;
  enrolled_at: string;
  start_date?: string | null;
  goal_id?: string | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
  goal?: {
    id: string;
    goal_name: string;
    calorie_adjustment: number;
  } | null;
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
  workout_details?: any;
  workout_screenshot_url?: string | null;
  steps_screenshot_url?: string | null;
  macros_screenshot_url?: string | null;
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

interface PhysiqueCheckin {
  id: string;
  enrollment_id: string;
  check_in_number: number;
  front_photo_url: string | null;
  back_photo_url: string | null;
  side_photo_url: string | null;
  submitted_at: string;
}

interface Challenge {
  id: string;
  start_at: string;
  end_at: string;
  calorie_multiplier?: number | null;
  physique_frequency?: string | null;
  weight_measurement_frequency?: string | null;
}

interface EnrollmentHistory {
  id: string;
  enrollment_id: string;
  effective_date: string;
  calculated_calories: number;
  calorie_adjustment: number | null;
  protein_percent: number | null;
  carbs_percent: number | null;
  fat_percent: number | null;
  goal_id: string | null;
  created_at: string;
}

export default function ParticipantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const userId = params.userId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [redDays, setRedDays] = useState<RedDay[]>([]);
  const [weightCheckins, setWeightCheckins] = useState<WeightCheckin[]>([]);
  const [physiqueCheckins, setPhysiqueCheckins] = useState<PhysiqueCheckin[]>([]);
  const [enrollmentHistory, setEnrollmentHistory] = useState<EnrollmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingCalories, setIsEditingCalories] = useState(false);
  const [calorieAdjustment, setCalorieAdjustment] = useState<number>(0);
  const [savingCalories, setSavingCalories] = useState(false);
  const [proteinPercent, setProteinPercent] = useState<number>(0);
  const [carbsPercent, setCarbsPercent] = useState<number>(0);
  const [fatPercent, setFatPercent] = useState<number>(0);

  useEffect(() => {
    if (challengeId && userId) {
      fetchData();
    }
  }, [challengeId, userId]);

  useEffect(() => {
    if (enrollment) {
      setCalorieAdjustment(enrollment.calorie_adjustment || 0);
      setProteinPercent(enrollment.protein_percent || 0);
      setCarbsPercent(enrollment.carbs_percent || 0);
      setFatPercent(enrollment.fat_percent || 0);
      setIsEditingCalories(false);
    }
  }, [enrollment]);

  // Debug: Log enrollment history when it's loaded
  useEffect(() => {
    if (enrollmentHistory.length > 0) {
      console.log('Enrollment history loaded:', enrollmentHistory);
    } else {
      console.log('No enrollment history found. Enrollment ID:', enrollment?.id);
    }
  }, [enrollmentHistory, enrollment]);

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
        setCalorieAdjustment(checkinsData.enrollment?.calorie_adjustment || 0);
        setDailyCheckins(checkinsData.checkins || []);
        setRedDays(checkinsData.redDays || []);
        setWeightCheckins(checkinsData.weightCheckins || []);
        setPhysiqueCheckins(checkinsData.physiqueCheckins || []);
        setEnrollmentHistory(checkinsData.enrollmentHistory || []);
      }
    } catch (error) {
      console.error('Error fetching participant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalorieAdjustment = async () => {
    if (!enrollment) return;

    // Validate macros sum to 100%
    const macroSum = proteinPercent + carbsPercent + fatPercent;
    if (Math.abs(macroSum - 100) > 0.01) {
      alert('Macro percentages must sum to 100%');
      return;
    }

    try {
      setSavingCalories(true);
      const response = await fetch(`/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calorie_adjustment: calorieAdjustment,
          protein_percent: proteinPercent,
          carbs_percent: carbsPercent,
          fat_percent: fatPercent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollment(data.enrollment);
        setIsEditingCalories(false);
      } else {
        const errorData = await response.json();
        console.error('Error updating calorie adjustment and macros:', errorData);
        alert('Failed to update: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving calorie adjustment and macros:', error);
      alert('Failed to save changes');
    } finally {
      setSavingCalories(false);
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
    if (!enrollment || !challenge) {
      return { calories: 0, macros: null };
    }

    // Normalize date to YYYY-MM-DD format for comparison
    const dateStr = date.split('T')[0];
    const checkDate = new Date(dateStr + 'T00:00:00');

    // Find the most recent history record that is <= the check-in date
    // History records are ordered by effective_date, so we find the last one before or on the check date
    const applicableHistory = enrollmentHistory
      .filter(h => {
        const effectiveDateStr = h.effective_date.split('T')[0];
        const effectiveDate = new Date(effectiveDateStr + 'T00:00:00');
        return effectiveDate <= checkDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.effective_date);
        const dateB = new Date(b.effective_date);
        return dateB.getTime() - dateA.getTime(); // Sort descending to get most recent first
      })[0]; // Get the most recent one

    // Use history values if available, otherwise use current enrollment values
    const calories = applicableHistory?.calculated_calories ?? enrollment.calculated_calories ?? 0;
    const proteinPercent = applicableHistory?.protein_percent ?? enrollment.protein_percent ?? 0;
    const carbsPercent = applicableHistory?.carbs_percent ?? enrollment.carbs_percent ?? 0;
    const fatPercent = applicableHistory?.fat_percent ?? enrollment.fat_percent ?? 0;

    const protein = proteinPercent ? (calories * proteinPercent / 100) / 4 : 0;
    const carbs = carbsPercent ? (calories * carbsPercent / 100) / 4 : 0;
    const fat = fatPercent ? (calories * fatPercent / 100) / 9 : 0;

    return {
      calories,
      macros: {
        protein,
        carbs,
        fat,
      },
    };
  }, [enrollment, challenge, enrollmentHistory]);

  // Calculate target values for each check-in date (for charts)
  const getTargetValuesForDate = useCallback((date: string) => {
    const effective = getEffectiveValuesForDate(date);
    return {
      calories: effective.calories || null,
      protein: effective.macros?.protein || null,
      carbs: effective.macros?.carbs || null,
      fat: effective.macros?.fat || null,
    };
  }, [getEffectiveValuesForDate]);

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
          {enrollment.user?.avatar_url ? (
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
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {getUserName(enrollment.user)
                .substring(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
              {getUserName(enrollment.user)}
            </h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
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
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {enrollment.goal && (
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  Goal: {enrollment.goal.goal_name}
                </span>
              )}
              {enrollment.bodyweight_kg && (
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  Bodyweight: {enrollment.bodyweight_kg} kg
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calorie and Macros Section - Combined */}
      <div
        className="card"
        style={{
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* Calorie Calculation Section */}
          <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '32px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
              Calorie Calculation
            </h2>
        {(() => {
          const multiplier = challenge?.calorie_multiplier || 15;
          const baseCalories = enrollment.bodyweight_kg 
            ? Math.round(enrollment.bodyweight_kg * 2.2 * multiplier)
            : 0;
          const adjustment = isEditingCalories ? calorieAdjustment : (enrollment.calorie_adjustment || 0);
          const totalCalories = baseCalories + adjustment;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>
                  Base Calories:
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                  {baseCalories} kcal
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>
                  Calorie Adjustment:
                </div>
                {isEditingCalories ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={calorieAdjustment}
                      onChange={(e) => setCalorieAdjustment(Number(e.target.value))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        width: '100px',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#FFFFFF' }}>kcal</span>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: adjustment >= 0 ? '#34C759' : '#FF3B30',
                    }}
                  >
                    {adjustment >= 0 ? '+' : ''}{adjustment} kcal
                  </div>
                )}
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>
                    Total Calories:
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
                    {totalCalories} kcal
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
          </div>

          {/* Macros Breakdown Section */}
          <div style={{ paddingLeft: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
                Macros Breakdown
              </h2>
              {isEditingCalories ? (() => {
                const protein = proteinPercent;
                const carbs = carbsPercent;
                const fat = fatPercent;
                const macroSum = protein + carbs + fat;
                const isValidMacros = Math.abs(macroSum - 100) < 0.01;
                const canSave = isValidMacros && !savingCalories;

                return (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setIsEditingCalories(false);
                        setCalorieAdjustment(enrollment.calorie_adjustment || 0);
                        setProteinPercent(enrollment.protein_percent || 0);
                        setCarbsPercent(enrollment.carbs_percent || 0);
                        setFatPercent(enrollment.fat_percent || 0);
                      }}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'transparent',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCalorieAdjustment}
                      disabled={!canSave}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: canSave ? '#007AFF' : 'rgba(255, 255, 255, 0.1)',
                        color: canSave ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: canSave ? 'pointer' : 'not-allowed',
                        opacity: canSave ? 1 : 0.5,
                      }}
                    >
                      {savingCalories ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                );
              })() : (
                <button
                  onClick={() => setIsEditingCalories(true)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.0833 1.75C11.3021 1.53125 11.6979 1.53125 11.9167 1.75L12.25 2.08333C12.4688 2.30208 12.4688 2.69792 12.25 2.91667L11.0833 4.08333L9.91667 2.91667L11.0833 1.75ZM10.5 4.66667L3.5 11.6667V12.25H4.08333L11.0833 5.25L10.5 4.66667Z" fill="currentColor"/>
                  </svg>
                  Edit
                </button>
              )}
            </div>
        {(() => {
          const multiplier = challenge?.calorie_multiplier || 15;
          const baseCalories = enrollment.bodyweight_kg 
            ? Math.round(enrollment.bodyweight_kg * 2.2 * multiplier)
            : 0;
          const adjustment = isEditingCalories ? calorieAdjustment : (enrollment.calorie_adjustment || 0);
          const totalCalories = baseCalories + adjustment;
          
          const protein = isEditingCalories ? proteinPercent : (enrollment.protein_percent || 0);
          const carbs = isEditingCalories ? carbsPercent : (enrollment.carbs_percent || 0);
          const fat = isEditingCalories ? fatPercent : (enrollment.fat_percent || 0);
          
          const macroSum = protein + carbs + fat;
          const isValidMacros = Math.abs(macroSum - 100) < 0.01;
          
          // Calculate grams
          const proteinGrams = totalCalories > 0 ? Math.round((totalCalories * protein / 100) / 4) : 0;
          const carbsGrams = totalCalories > 0 ? Math.round((totalCalories * carbs / 100) / 4) : 0;
          const fatGrams = totalCalories > 0 ? Math.round((totalCalories * fat / 100) / 9) : 0;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '8px' }}>
                    Protein
                  </div>
                  {isEditingCalories ? (
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => setProteinPercent(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {protein.toFixed(0)}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'rgba(235, 235, 245, 0.5)', textAlign: 'center', marginTop: '4px' }}>
                    %
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '8px' }}>
                    Carbs
                  </div>
                  {isEditingCalories ? (
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbsPercent(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {carbs.toFixed(0)}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'rgba(235, 235, 245, 0.5)', textAlign: 'center', marginTop: '4px' }}>
                    %
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '8px' }}>
                    Fat
                  </div>
                  {isEditingCalories ? (
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => setFatPercent(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {fat.toFixed(0)}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'rgba(235, 235, 245, 0.5)', textAlign: 'center', marginTop: '4px' }}>
                    %
                  </div>
                </div>
              </div>
              
              {isEditingCalories && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isValidMacros ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                    border: `1px solid ${isValidMacros ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isValidMacros ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontSize: '13px', color: '#34C759', fontWeight: '600' }}>
                        Macros sum to 100%
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#FF3B30', fontWeight: '600' }}>
                      Macros sum to {macroSum.toFixed(1)}% (must be 100%)
                    </span>
                  )}
                </div>
              )}
              
              <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.8)', textAlign: 'center', marginTop: '4px' }}>
                Protein: {proteinGrams}g • Carbs: {carbsGrams}g • Fat: {fatGrams}g
              </div>
            </div>
          );
        })()}
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
          weightCheckins={weightCheckins}
          physiqueCheckins={physiqueCheckins}
          physiqueFrequency={challenge?.physique_frequency || 'weekly'}
          weightMeasurementFrequency={challenge?.weight_measurement_frequency || 'weekly'}
        />
      )}

      {/* Charts */}
      {enrollment.status === 'onboarded' && dailyCheckins.length > 0 && (
        <ParticipantCharts
          dailyCheckins={dailyCheckins}
          weightCheckins={weightCheckins}
          getTargetValuesForDate={getTargetValuesForDate}
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
    </div>
  );
}


