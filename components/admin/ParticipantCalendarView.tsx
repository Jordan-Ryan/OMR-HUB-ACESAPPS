'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WalkIcon, NutritionIcon, BarbellIcon, FitnessIcon } from '@/components/icons/AdminIcons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WorkoutDetail {
  activityType?: 'weights' | 'cardio' | 'other';
  name?: string;
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
  workout_details?: WorkoutDetail[] | null;
}

interface RedDay {
  id: string;
  enrollment_id: string;
  start_date: string;
  end_date: string;
}

interface ParticipantCalendarViewProps {
  dailyCheckins: DailyCheckin[];
  challengeStartDate: Date;
  challengeEndDate: Date;
  enrollmentStartDate?: Date;
  stepGoal: number;
  getEffectiveValuesForDate: (date: string) => { calories: number; macros: { protein: number; carbs: number; fat: number } | null };
  redDays?: RedDay[];
  onDayClick?: (date: string) => void;
}

const getWorkoutIcons = (checkin: DailyCheckin | undefined): { weights: boolean; cardio: boolean } => {
  if (!checkin || !checkin.workout_completed) return { weights: false, cardio: false };
  
  // First check workout_details for activityType
  if (checkin.workout_details && Array.isArray(checkin.workout_details) && checkin.workout_details.length > 0) {
    const hasWeights = checkin.workout_details.some((detail: WorkoutDetail) => detail.activityType === 'weights');
    const hasCardio = checkin.workout_details.some((detail: WorkoutDetail) => detail.activityType === 'cardio');
    return { weights: hasWeights, cardio: hasCardio };
  }
  
  // Fall back to workout_type string matching
  if (checkin.workout_type) {
    const type = checkin.workout_type.toLowerCase();
    const hasWeights = type.includes('weight') || type.includes('strength') || type.includes('circuit');
    const hasCardio = type.includes('cardio') || type.includes('run') || type.includes('bike');
    return { weights: hasWeights, cardio: hasCardio };
  }
  
  return { weights: false, cardio: false };
};

export function ParticipantCalendarView({
  dailyCheckins,
  challengeStartDate,
  challengeEndDate,
  enrollmentStartDate,
  stepGoal,
  getEffectiveValuesForDate,
  redDays = [],
  onDayClick,
}: ParticipantCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    if (now >= challengeStartDate && now <= challengeEndDate) {
      return now;
    }
    return challengeStartDate;
  });

  useEffect(() => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const challengeStartMonth = new Date(challengeStartDate.getFullYear(), challengeStartDate.getMonth(), 1);
    const challengeEndMonth = new Date(challengeEndDate.getFullYear(), challengeEndDate.getMonth(), 1);

    if (currentMonthStart < challengeStartMonth) {
      setCurrentMonth(new Date(challengeStartDate));
    } else if (currentMonthStart > challengeEndMonth) {
      setCurrentMonth(new Date(challengeEndDate));
    }
  }, [challengeStartDate, challengeEndDate]);

  const checkinsByDate = useMemo(() => {
    const map = new Map<string, DailyCheckin>();
    dailyCheckins.forEach(checkin => {
      map.set(checkin.date, checkin);
    });
    return map;
  }, [dailyCheckins]);

  const isRedDay = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return redDays.some(redDay => {
      const start = new Date(redDay.start_date);
      const end = new Date(redDay.end_date);
      const checkDate = new Date(dateStr);
      return checkDate >= start && checkDate <= end;
    });
  }, [redDays]);

  const formatDateString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday-start

    const iconStartDate = enrollmentStartDate || challengeStartDate;
    const iconStartDateStr = formatDateString(iconStartDate);
    const endDateStr = formatDateString(challengeEndDate);
    const challengeStartDateStr = formatDateString(challengeStartDate);

    const days: Array<{ date: Date; isCurrentMonth: boolean; isInChallenge: boolean; showIcons: boolean }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = formatDateString(date);
      const isInChallenge = dateStr >= challengeStartDateStr && dateStr <= endDateStr;
      const showIcons = dateStr >= iconStartDateStr && dateStr <= endDateStr;
      days.push({ date, isCurrentMonth: false, isInChallenge, showIcons });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateString(date);
      const isInChallenge = dateStr >= challengeStartDateStr && dateStr <= endDateStr;
      const showIcons = dateStr >= iconStartDateStr && dateStr <= endDateStr;
      days.push({ date, isCurrentMonth: true, isInChallenge, showIcons });
    }

    const remainingDays = Math.min(35 - days.length, 7);
    for (let day = 1; day <= remainingDays && days.length < 35; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = formatDateString(date);
      const isInChallenge = dateStr >= challengeStartDateStr && dateStr <= endDateStr;
      const showIcons = dateStr >= iconStartDateStr && dateStr <= endDateStr;
      days.push({ date, isCurrentMonth: false, isInChallenge, showIcons });
    }

    return days;
  }, [currentMonth, challengeStartDate, challengeEndDate, enrollmentStartDate, formatDateString]);

  const getStepsStatus = (checkin: DailyCheckin | undefined): 'green' | 'red' | 'none' => {
    if (!checkin || checkin.steps === null) return 'none';
    return checkin.steps >= stepGoal ? 'green' : 'red';
  };

  const getMacrosStatus = (checkin: DailyCheckin | undefined, date: string): 'green' | 'amber' | 'red' | 'none' => {
    if (!checkin || checkin.protein_g === null || checkin.carbs_g === null || checkin.fat_g === null) return 'none';

    const effective = getEffectiveValuesForDate(date);
    if (!effective.macros) return 'none';

    const { protein, carbs, fat } = effective.macros;
    const leeway = 0.1;

    const proteinInRange = checkin.protein_g >= protein * (1 - leeway) && checkin.protein_g <= protein * (1 + leeway);
    const carbsInRange = checkin.carbs_g >= carbs * (1 - leeway) && checkin.carbs_g <= carbs * (1 + leeway);
    const fatInRange = checkin.fat_g >= fat * (1 - leeway) && checkin.fat_g <= fat * (1 + leeway);
    const allMacrosInRange = proteinInRange && carbsInRange && fatInRange;

    if (checkin.calories_consumed === null || effective.calories <= 0) return 'none';

    const caloriesInRange = checkin.calories_consumed >= effective.calories * (1 - leeway) &&
                            checkin.calories_consumed <= effective.calories * (1 + leeway);

    if (allMacrosInRange && caloriesInRange) return 'green';
    if (caloriesInRange && !allMacrosInRange) return 'amber';
    return 'red';
  };

  const getWorkoutStatus = (checkin: DailyCheckin | undefined): { weights: boolean; cardio: boolean } => {
    return getWorkoutIcons(checkin);
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);

      const challengeStartMonth = new Date(challengeStartDate.getFullYear(), challengeStartDate.getMonth(), 1);
      const challengeEndMonth = new Date(challengeEndDate.getFullYear(), challengeEndDate.getMonth(), 1);
      const newMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);

      if (newMonth < challengeStartMonth) {
        return new Date(challengeStartMonth);
      }
      if (newMonth > challengeEndMonth) {
        return new Date(challengeEndMonth);
      }

      return newDate;
    });
  };

  const canNavigatePrev = useMemo(() => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const challengeStartMonth = new Date(challengeStartDate.getFullYear(), challengeStartDate.getMonth(), 1);
    return currentMonthStart > challengeStartMonth;
  }, [currentMonth, challengeStartDate]);

  const canNavigateNext = useMemo(() => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const challengeEndMonth = new Date(challengeEndDate.getFullYear(), challengeEndDate.getMonth(), 1);
    return currentMonthStart < challengeEndMonth;
  }, [currentMonth, challengeEndDate]);

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '10px',
        marginBottom: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Month Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '12px',
        padding: '0 4px',
      }}>
        <button
          onClick={() => changeMonth(-1)}
          disabled={!canNavigatePrev}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            border: 'none',
            color: canNavigatePrev ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
            cursor: canNavigatePrev ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600', 
          color: 'rgba(255, 255, 255, 0.8)',
        }}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          disabled={!canNavigateNext}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            border: 'none',
            color: canNavigateNext ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
            cursor: canNavigateNext ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          →
        </button>
      </div>

      {/* Calendar Grid - Column-based layout like React Native */}
      <div>
        {/* Day Headers - Single letter */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '4px',
          padding: '0 2px',
        }}>
          {DAYS.map((dayName) => (
            <div
              key={dayName}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.5)',
                padding: '4px 2px',
              }}
            >
              {dayName.substring(0, 1)}
            </div>
          ))}
        </div>

        {/* Calendar Rows - Each row is a week */}
        {Array.from({ length: Math.ceil(monthDays.length / 7) }).map((_, weekIndex) => {
          const weekDays = monthDays.slice(weekIndex * 7, (weekIndex + 1) * 7);

          return (
            <div key={weekIndex} style={{ 
              display: 'flex', 
              marginBottom: '2px',
              padding: '0 2px',
            }}>
              {weekDays.map((dayInfo, dayIndex) => {
                const dateKey = formatDateKey(dayInfo.date);
                const checkin = checkinsByDate.get(dateKey);
                const stepsStatus = getStepsStatus(checkin);
                const macrosStatus = getMacrosStatus(checkin, dateKey);
                const workoutStatus = getWorkoutStatus(checkin);
                const isToday = formatDateKey(new Date()) === dateKey;
                const isRed = isRedDay(dayInfo.date);
                const hasSteps = checkin && checkin.steps !== null;
                const hasMacros = checkin && checkin.protein_g !== null && checkin.carbs_g !== null && checkin.fat_g !== null;

                return (
                  <div
                    key={dayIndex}
                    onClick={() => {
                      if (checkin && onDayClick) {
                        onDayClick(dateKey);
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '4px 2px',
                      borderRadius: '4px',
                      margin: '0 1px',
                      minHeight: '56px',
                      backgroundColor: isRed
                        ? 'rgba(255, 59, 48, 0.3)'
                        : dayInfo.isCurrentMonth
                        ? isToday
                          ? 'rgba(0, 122, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(255, 255, 255, 0.01)',
                      opacity: dayInfo.isInChallenge ? 1 : 0.3,
                      borderWidth: isRed ? 2 : (!dayInfo.isInChallenge ? 1 : 0),
                      borderStyle: 'solid',
                      borderColor: isRed
                        ? '#FF3B30'
                        : !dayInfo.isInChallenge
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'transparent',
                      cursor: checkin ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (checkin) {
                        e.currentTarget.style.backgroundColor = isRed
                          ? 'rgba(255, 59, 48, 0.4)'
                          : 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isRed
                        ? 'rgba(255, 59, 48, 0.3)'
                        : dayInfo.isCurrentMonth
                        ? isToday
                          ? 'rgba(0, 122, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(255, 255, 255, 0.01)';
                    }}
                  >
                    {/* Day Number */}
                    <div style={{ 
                      marginBottom: '2px', 
                      minHeight: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: isToday ? 'bold' : '500',
                          color: dayInfo.isCurrentMonth
                            ? isToday
                              ? '#007AFF'
                              : 'rgba(255, 255, 255, 0.8)'
                            : 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {dayInfo.date.getDate()}
                      </span>
                    </div>

                    {/* Icons - only show if showIcons is true, stacked vertically */}
                    {dayInfo.showIcons && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1px',
                        minHeight: '36px',
                        width: '100%',
                      }}>
                        {/* Steps Icon - always show, grey if no data */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '14px',
                          width: '100%',
                        }}>
                          <WalkIcon
                            width={14}
                            height={14}
                            style={{
                              color:
                                stepsStatus === 'green'
                                  ? '#34C759'
                                  : stepsStatus === 'red'
                                  ? '#FF3B30'
                                  : 'rgba(255, 255, 255, 0.3)',
                            }}
                          />
                        </div>

                        {/* Macros Icon - always show, grey if no data */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '14px',
                          width: '100%',
                        }}>
                          <NutritionIcon
                            width={14}
                            height={14}
                            style={{
                              color:
                                macrosStatus === 'green'
                                  ? '#34C759'
                                  : macrosStatus === 'amber'
                                  ? '#FF9500'
                                  : macrosStatus === 'red'
                                  ? '#FF3B30'
                                  : 'rgba(255, 255, 255, 0.3)',
                            }}
                          />
                        </div>

                        {/* Workout Icons - only show if workout was done */}
                        {(workoutStatus.weights || workoutStatus.cardio) && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '12px',
                            width: '100%',
                            gap: '2px',
                          }}>
                            {workoutStatus.weights && (
                              <BarbellIcon width={12} height={12} style={{ color: '#34C759' }} />
                            )}
                            {workoutStatus.cardio && (
                              <FitnessIcon width={12} height={12} style={{ color: '#34C759' }} />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
