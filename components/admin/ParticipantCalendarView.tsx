'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WalkIcon, NutritionIcon, BarbellIcon, FitnessIcon, CameraIcon, ScalesIcon } from '@/components/icons/AdminIcons';

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
  workout_screenshot_url?: string | null;
  steps_screenshot_url?: string | null;
  macros_screenshot_url?: string | null;
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

interface RedDay {
  id: string;
  enrollment_id: string;
  start_date: string;
  end_date: string;
}

interface WeeklyWorkoutSchedule {
  id: string;
  enrollment_id: string;
  week_number: number;
  workout_type: 'weights' | 'cardio';
  workout_index: number | null;
  scheduled_date: string;
  workout_title: string | null;
  created_at: string;
}

interface ParticipantCalendarViewProps {
  dailyCheckins: DailyCheckin[];
  challengeStartDate: Date;
  challengeEndDate: Date;
  enrollmentStartDate?: Date;
  stepGoal: number;
  getEffectiveValuesForDate: (date: string) => { calories: number; macros: { protein: number; carbs: number; fat: number } | null };
  redDays?: RedDay[];
  weightCheckins?: WeightCheckin[];
  physiqueCheckins?: PhysiqueCheckin[];
  physiqueFrequency?: string;
  weightMeasurementFrequency?: string;
  scheduledWorkouts?: WeeklyWorkoutSchedule[];
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
  weightCheckins = [],
  physiqueCheckins = [],
  physiqueFrequency = 'weekly',
  weightMeasurementFrequency = 'weekly',
  scheduledWorkouts = [],
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

  // Create map of scheduled workouts by date
  const scheduledWorkoutsByDate = useMemo(() => {
    const map = new Map<string, WeeklyWorkoutSchedule[]>();
    scheduledWorkouts.forEach(workout => {
      const date = workout.scheduled_date;
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)!.push(workout);
    });
    return map;
  }, [scheduledWorkouts]);

  // Get scheduled workout status for a date
  const getScheduledWorkoutStatus = useCallback((dateStr: string): 'grey' | 'red' | 'green' | 'orange' | null => {
    const scheduledForDate = scheduledWorkouts.filter(s => s.scheduled_date === dateStr);
    if (scheduledForDate.length === 0) {
      // Check if there's an unplanned workout completed on this date
      const checkin = checkinsByDate.get(dateStr);
      if (checkin && checkin.workout_completed) {
        return 'orange'; // Unplanned workout completed
      }
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(dateStr);
    scheduledDate.setHours(0, 0, 0, 0);
    const isPastDue = scheduledDate < today;

    const checkin = checkinsByDate.get(dateStr);
    const completedOnScheduledDay = checkin && checkin.workout_completed;

    // For scheduled workouts, if completed on the scheduled day, show green
    if (completedOnScheduledDay) {
      return 'green';
    }

    // If past due and not completed, show red
    if (isPastDue && !completedOnScheduledDay) {
      return 'red';
    }

    return 'grey'; // Planned but not yet due/completed
  }, [scheduledWorkouts, checkinsByDate]);

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

  // Helper function to get Monday of a week
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Helper function to calculate expected date for a physique check-in based on frequency
  // check_in_number 1 is on day 1 (start_date), then spaced by frequency
  const getExpectedPhysiqueDate = (checkInNumber: number): Date | null => {
    const startDate = enrollmentStartDate || challengeStartDate;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    // Determine weeks per check-in based on frequency
    // monthly = 4 weeks, weekly = 1 week, biweekly = 2 weeks (default to weekly)
    const weeksPerCheckin = physiqueFrequency === 'monthly' ? 4 : (physiqueFrequency === 'biweekly' ? 2 : 1);
    
    // Calculate expected date: (check_in_number - 1) * weeksPerCheckin weeks after start_date
    const expectedDate = new Date(start);
    expectedDate.setDate(expectedDate.getDate() + (checkInNumber - 1) * weeksPerCheckin * 7);
    expectedDate.setHours(0, 0, 0, 0);
    
    // Only return if within challenge range
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    if (expectedDate > challengeEnd) return null;
    
    return expectedDate;
  };

  // Helper function to calculate expected date for a weight check-in based on frequency
  // check_in_number 1 is on day 1 (start_date), then spaced by frequency
  const getExpectedWeightDate = (checkInNumber: number): Date | null => {
    const startDate = enrollmentStartDate || challengeStartDate;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    // Determine weeks per check-in based on frequency
    // biweekly = 2 weeks, weekly = 1 week, monthly = 4 weeks (default to weekly)
    const weeksPerCheckin = weightMeasurementFrequency === 'biweekly' ? 2 : (weightMeasurementFrequency === 'monthly' ? 4 : 1);
    
    // Calculate expected date: (check_in_number - 1) * weeksPerCheckin weeks after start_date
    const expectedDate = new Date(start);
    expectedDate.setDate(expectedDate.getDate() + (checkInNumber - 1) * weeksPerCheckin * 7);
    expectedDate.setHours(0, 0, 0, 0);
    
    // Only return if within challenge range
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    if (expectedDate > challengeEnd) return null;
    
    return expectedDate;
  };

  // Helper function to check if physique check-in should be shown and if it's missed (red)
  const getPhysiqueCheckinStatus = (date: string): { show: boolean; isMissed: boolean } => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First, check if there's a submitted check-in on this date
    const submittedOnThisDate = physiqueCheckins.some(p => {
      const physiqueDate = new Date(p.submitted_at);
      physiqueDate.setHours(0, 0, 0, 0);
      if (physiqueDate.getTime() === checkDate.getTime()) {
        return !!(p.front_photo_url || p.back_photo_url || p.side_photo_url);
      }
      return false;
    });
    
    if (submittedOnThisDate) {
      return { show: true, isMissed: false }; // Show on actual submission date, not red
    }
    
    // Check if this date is an expected check-in date (day 1, then every frequency interval)
    const startDate = enrollmentStartDate || challengeStartDate;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const weeksPerCheckin = physiqueFrequency === 'monthly' ? 4 : (physiqueFrequency === 'biweekly' ? 2 : 1);
    
    // Calculate maximum possible check_in_number (based on days since start and frequency)
    const daysSinceStart = Math.floor((checkDate.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const maxCheckInNumber = Math.floor(daysSinceStart / (weeksPerCheckin * 7)) + 1;
    
    for (let checkInNum = 1; checkInNum <= maxCheckInNumber; checkInNum++) {
      const expectedDate = getExpectedPhysiqueDate(checkInNum);
      if (expectedDate && expectedDate.getTime() === checkDate.getTime()) {
        // This is an expected check-in date
        const submittedCheckin = physiqueCheckins.find(p => p.check_in_number === checkInNum);
        
        if (submittedCheckin) {
          // Check-in exists - show it if it has photos
          const hasPhotos = !!(submittedCheckin.front_photo_url || submittedCheckin.back_photo_url || submittedCheckin.side_photo_url);
          if (hasPhotos) {
            // Show on the expected date (check-in exists and has photos)
            return { show: true, isMissed: false };
          } else if (checkDate <= today) {
            return { show: true, isMissed: true };
          }
        } else if (checkDate <= today) {
          return { show: true, isMissed: true };
        }
      }
    }
    
    return { show: false, isMissed: false };
  };

  // Helper function to check if weight check-in should be shown and if it's missed (red)
  const getWeightCheckinStatus = (date: string): { show: boolean; isMissed: boolean } => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First, check if there's a submitted check-in on this date
    const submittedOnThisDate = weightCheckins.some(w => {
      const weightDate = new Date(w.submitted_at);
      weightDate.setHours(0, 0, 0, 0);
      return weightDate.getTime() === checkDate.getTime();
    });
    
    if (submittedOnThisDate) {
      return { show: true, isMissed: false }; // Show on actual submission date, not red
    }
    
    // Check if this date is an expected check-in date (day 1, then every frequency interval)
    const startDate = enrollmentStartDate || challengeStartDate;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const weeksPerCheckin = weightMeasurementFrequency === 'biweekly' ? 2 : (weightMeasurementFrequency === 'monthly' ? 4 : 1);
    
    // Calculate maximum possible check_in_number (based on days since start and frequency)
    const daysSinceStart = Math.floor((checkDate.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const maxCheckInNumber = Math.floor(daysSinceStart / (weeksPerCheckin * 7)) + 1;
    
    for (let checkInNum = 1; checkInNum <= maxCheckInNumber; checkInNum++) {
      const expectedDate = getExpectedWeightDate(checkInNum);
      if (expectedDate && expectedDate.getTime() === checkDate.getTime()) {
        // This is an expected check-in date
        const submittedCheckin = weightCheckins.find(w => w.check_in_number === checkInNum);
        
        if (submittedCheckin) {
          // Check-in exists - show it on the expected date
          return { show: true, isMissed: false };
        } else if (checkDate <= today) {
          return { show: true, isMissed: true };
        }
      }
    }
    
    return { show: false, isMissed: false };
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
                
                // Check if check-in is missed (day is in past/today, within challenge range, after enrollment start, but no check-in)
                const dayDate = new Date(dayInfo.date);
                dayDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const enrollmentStart = enrollmentStartDate ? new Date(enrollmentStartDate) : new Date(challengeStartDate);
                enrollmentStart.setHours(0, 0, 0, 0);
                const challengeEnd = new Date(challengeEndDate);
                challengeEnd.setHours(23, 59, 59, 999);
                const isMissedCheckin = !checkin && 
                  dayDate >= enrollmentStart && 
                  dayDate <= challengeEnd && 
                  dayDate < today && // Only mark as missed if it's in the past, not today
                  dayInfo.showIcons;

                // Determine background color: red days get red background, today gets transparent, others get subtle background
                let backgroundColor = 'transparent';
                if (isRed) {
                  backgroundColor = 'rgba(255, 59, 48, 0.3)';
                } else if (isMissedCheckin) {
                  backgroundColor = 'rgba(255, 59, 48, 0.3)';
                } else if (dayInfo.isCurrentMonth) {
                  backgroundColor = isToday ? 'transparent' : 'rgba(255, 255, 255, 0.03)';
                } else {
                  backgroundColor = 'rgba(255, 255, 255, 0.01)';
                }

                // Determine border: red days get red border, today gets green border, missed check-ins get red border
                let borderWidth = 0;
                let borderColor = 'transparent';
                if (isRed) {
                  borderWidth = 2;
                  borderColor = '#FF3B30';
                } else if (isToday) {
                  borderWidth = 2;
                  borderColor = '#34C759'; // Green border for today
                } else if (isMissedCheckin) {
                  borderWidth = 2;
                  borderColor = '#FF3B30';
                } else if (!dayInfo.isInChallenge) {
                  borderWidth = 1;
                  borderColor = 'rgba(255, 255, 255, 0.1)';
                }

                return (
                  <div
                    key={dayIndex}
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
                      backgroundColor,
                      opacity: dayInfo.isInChallenge ? 1 : 0.3,
                      borderWidth,
                      borderStyle: 'solid',
                      borderColor,
                      cursor: 'default',
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

                        {/* Workout Icons - show planned sessions or completed workouts */}
                        {(() => {
                          const scheduledStatus = getScheduledWorkoutStatus(dateKey);
                          const hasScheduledWorkout = scheduledWorkoutsByDate.has(dateKey);
                          
                          if (hasScheduledWorkout) {
                            // Show scheduled workout status with icons
                            const scheduledForDate = scheduledWorkoutsByDate.get(dateKey) || [];
                            const workoutTypes = scheduledForDate.map(w => w.workout_type);
                            const hasWeights = workoutTypes.includes('weights');
                            const hasCardio = workoutTypes.includes('cardio');
                            
                            let statusColor = 'rgba(255, 255, 255, 0.3)';
                            if (scheduledStatus === 'green') {
                              statusColor = '#34C759';
                            } else if (scheduledStatus === 'red') {
                              statusColor = '#FF3B30';
                            } else if (scheduledStatus === 'grey') {
                              statusColor = 'rgba(255, 255, 255, 0.3)';
                            }
                            
                            // Show icons for scheduled workouts - prefer weights if both exist, otherwise show the type
                            return (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: '12px',
                                width: '100%',
                                gap: '2px',
                              }}>
                                {hasWeights && (
                                  <BarbellIcon width={12} height={12} style={{ color: statusColor }} />
                                )}
                                {hasCardio && (
                                  <FitnessIcon width={12} height={12} style={{ color: statusColor }} />
                                )}
                              </div>
                            );
                          } else if (scheduledStatus === 'orange') {
                            // Unplanned workout completed
                            return (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: '12px',
                                width: '100%',
                                gap: '2px',
                              }}>
                                {workoutStatus.weights && (
                                  <BarbellIcon width={12} height={12} style={{ color: '#FF9500' }} />
                                )}
                                {workoutStatus.cardio && (
                                  <FitnessIcon width={12} height={12} style={{ color: '#FF9500' }} />
                                )}
                                {!workoutStatus.weights && !workoutStatus.cardio && (
                                  <FitnessIcon width={12} height={12} style={{ color: '#FF9500' }} />
                                )}
                              </div>
                            );
                          } else if (workoutStatus.weights || workoutStatus.cardio) {
                            // Regular workout completed (no schedule)
                            return (
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
                            );
                          }
                          return null;
                        })()}

                        {/* Photo Icon - show if physique check-in was submitted or is due (red if missed) */}
                        {(() => {
                          const physiqueStatus = getPhysiqueCheckinStatus(dateKey);
                          return physiqueStatus.show && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              height: '12px',
                              width: '100%',
                            }}>
                              <CameraIcon width={12} height={12} style={{ color: physiqueStatus.isMissed ? '#FF3B30' : '#007AFF' }} />
                            </div>
                          );
                        })()}

                        {/* Scales Icon - show if weight check-in was done or is due (red if missed) */}
                        {(() => {
                          const weightStatus = getWeightCheckinStatus(dateKey);
                          return weightStatus.show && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              height: '12px',
                              width: '100%',
                            }}>
                              <ScalesIcon width={12} height={12} style={{ color: weightStatus.isMissed ? '#FF3B30' : '#5856D6' }} />
                            </div>
                          );
                        })()}
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
