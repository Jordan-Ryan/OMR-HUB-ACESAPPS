'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchInput from './SearchInput';
import { WalkIcon, NutritionIcon, BarbellIcon, FitnessIcon, BoatIcon, SnowIcon, BicycleIcon, CameraIcon, ScalesIcon } from '@/components/icons/AdminIcons';

interface Enrollment {
  id: string;
  user_id: string;
  status: 'pending' | 'onboarded';
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  enrolled_at: string;
  start_date?: string | null;
  calculated_calories?: number | null;
  calorie_adjustment?: number | null;
  protein_percent?: number | null;
  carbs_percent?: number | null;
  fat_percent?: number | null;
  bodyweight_kg?: number | null;
  min_steps?: number | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
}

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

interface ParticipantListProps {
  challengeId: string;
  challengeStartDate: string;
  challengeEndDate: string;
  physiqueFrequency?: string;
  weightMeasurementFrequency?: string;
  statusFilter?: 'all' | 'pending' | 'onboarded';
}

export default function ParticipantList({ 
  challengeId, 
  challengeStartDate, 
  challengeEndDate,
  physiqueFrequency = 'weekly',
  weightMeasurementFrequency = 'weekly',
  statusFilter = 'all'
}: ParticipantListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMissedSteps, setFilterMissedSteps] = useState(false);
  const [filterMissedMacros, setFilterMissedMacros] = useState(false);
  const [filterMissedWorkouts, setFilterMissedWorkouts] = useState(false);
  const [checkinsData, setCheckinsData] = useState<Record<string, Record<string, DailyCheckin>>>({});
  const [redDaysData, setRedDaysData] = useState<Record<string, Array<{ start_date: string; end_date: string }>>>({});
  const [latestWeights, setLatestWeights] = useState<Record<string, { weight_kg: number | null; check_in_number: number | null }>>({});
  const [enrollmentHistoryData, setEnrollmentHistoryData] = useState<Record<string, Array<{
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
  }>>>({});
  const [weightCheckinsData, setWeightCheckinsData] = useState<Record<string, Array<{
    enrollment_id: string;
    weight_kg: number | null;
    check_in_number: number;
    submitted_at: string;
  }>>>({});
  const [physiqueCheckinsData, setPhysiqueCheckinsData] = useState<Record<string, Array<{
    enrollment_id: string;
    check_in_number: number;
    front_photo_url: string | null;
    back_photo_url: string | null;
    side_photo_url: string | null;
    submitted_at: string;
  }>>>({});
  const [weeklyWorkoutSchedulesData, setWeeklyWorkoutSchedulesData] = useState<Record<string, Array<{
    id: string;
    enrollment_id: string;
    week_number: number;
    workout_type: 'weights' | 'cardio';
    workout_index: number | null;
    scheduled_date: string;
    workout_title: string | null;
    created_at: string;
  }>>>({});
  const [loadingCheckins, setLoadingCheckins] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [challengeMultiplier, setChallengeMultiplier] = useState<number | null>(null);
  const [isCurrentWeek, setIsCurrentWeek] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, {
    adjustment: number;
    totalCalories: number;
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  }>>({});

  useEffect(() => {
    fetchEnrollments();
    fetchChallengeMultiplier();
  }, [challengeId]);

  const fetchChallengeMultiplier = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        setChallengeMultiplier(data.challenge?.calorie_multiplier || 15);
      }
    } catch (error) {
      console.error('Error fetching challenge multiplier:', error);
      setChallengeMultiplier(15); // Default fallback
    }
  };

  useEffect(() => {
    if (enrollments.length > 0) {
      fetchCheckinsData();
    }
  }, [enrollments, challengeId]);

  // Set default week in URL if not present
  useEffect(() => {
    if (!challengeStartDate || !challengeEndDate) return;
    
    const weekParam = searchParams.get('week');
    if (!weekParam) {
      // Calculate default week (current week if ongoing, last week if ended)
      const challengeEnd = new Date(challengeEndDate);
      challengeEnd.setHours(23, 59, 59, 999);
      const now = new Date();
      
      // Helper to get Monday of a week (inlined)
      const getMonday = (date: Date): Date => {
        const d = new Date(date);
        const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
      };
      
      let defaultWeekMonday: Date;
      if (now > challengeEnd) {
        // Challenge has ended - use last week
        defaultWeekMonday = getMonday(challengeEnd);
      } else {
        // Challenge is ongoing - use current week
        defaultWeekMonday = getMonday(now);
      }
      
      // Format date as YYYY-MM-DD
      const yearStr = defaultWeekMonday.getFullYear();
      const monthStr = String(defaultWeekMonday.getMonth() + 1).padStart(2, '0');
      const dayStr = String(defaultWeekMonday.getDate()).padStart(2, '0');
      const weekParamValue = `${yearStr}-${monthStr}-${dayStr}`;
      
      const params = new URLSearchParams(searchParams.toString());
      params.set('week', weekParamValue);
      router.replace(`/admin/challenges/${challengeId}/participants?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, challengeStartDate, challengeEndDate, challengeId, router]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/challenges/${challengeId}/enrollments`);

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const data = await response.json();
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckinsData = async () => {
    try {
      setLoadingCheckins(true);
      const response = await fetch(`/api/admin/challenges/${challengeId}/participants/checkins`);

      if (!response.ok) {
        throw new Error('Failed to fetch check-ins');
      }

      const data = await response.json();
      setCheckinsData(data.checkins || {});
      setRedDaysData(data.redDays || {});
      setLatestWeights(data.latestWeights || {});
      setEnrollmentHistoryData(data.enrollmentHistory || {});
      setWeightCheckinsData(data.weightCheckins || {});
      setPhysiqueCheckinsData(data.physiqueCheckins || {});
      setWeeklyWorkoutSchedulesData(data.weeklyWorkoutSchedules || {});
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoadingCheckins(false);
    }
  };

  const getUserName = (user: Enrollment['user']) => {
    if (!user) return 'Unknown User';
    // Always prefer first_name + last_name over nickname
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    // Fallback to nickname only if no first/last name
    if (user.nickname) return user.nickname;
    return 'Unknown User';
  };

  const handleApprove = async (enrollmentId: string) => {
    if (!confirm('Approve this enrollment?')) return;
    try {
      const response = await fetch(
        `/api/admin/challenges/${challengeId}/enrollments/${enrollmentId}/approve`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to approve enrollment');
      fetchEnrollments();
    } catch (error) {
      console.error('Error approving enrollment:', error);
      alert('Failed to approve enrollment');
    }
  };

  const handleReject = async (enrollmentId: string) => {
    if (!confirm('Reject this enrollment? This will delete the enrollment.')) return;
    try {
      const response = await fetch(
        `/api/admin/challenges/${challengeId}/enrollments/${enrollmentId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to reject enrollment');
      fetchEnrollments();
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      alert('Failed to reject enrollment');
    }
  };

  // Calculate individual days from challenge dates and group by week (Monday to Sunday)
  const calculateDaysAndWeeks = () => {
    if (!challengeStartDate || !challengeEndDate) return { days: [], weeks: [] };
    
    // Helper to format date as YYYY-MM-DD for comparison (avoids timezone issues)
    const toDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Parse start and end dates, extract date strings for comparison
    const startDateStr = challengeStartDate.split('T')[0]; // Get YYYY-MM-DD part
    const endDateStr = challengeEndDate.split('T')[0]; // Get YYYY-MM-DD part
    
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T23:59:59');
    const days: Array<{ date: Date; dayNumber: number; weekNumber: number }> = [];
    const weeks: Array<{ weekNumber: number; startDate: Date; endDate: Date; startDayIndex: number; endDayIndex: number }> = [];
    
    // Find the Monday of the week containing the start date
    const getMonday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    
    // Find the Sunday of the week containing the end date
    const getSunday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust to get Sunday
      const sunday = new Date(d.setDate(diff));
      sunday.setHours(23, 59, 59, 999);
      return sunday;
    };
    
    const weekStart = getMonday(start);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = getSunday(end);
    weekEnd.setHours(23, 59, 59, 999);
    
    let currentDate = new Date(weekStart);
    let dayNumber = 1;
    let weekNumber = 1;
    let currentWeekStart = new Date(weekStart);
    let weekStartDayIndex = 0;
    
    while (currentDate <= weekEnd) {
      currentDate.setHours(0, 0, 0, 0);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // If it's Monday and we've already processed some days, start a new week
      if (dayOfWeek === 1 && days.length > 0) {
        // Save previous week (ending on Sunday)
        const previousSunday = new Date(currentDate);
        previousSunday.setDate(previousSunday.getDate() - 1);
        previousSunday.setHours(23, 59, 59, 999);
        weeks.push({
          weekNumber: weekNumber,
          startDate: new Date(currentWeekStart),
          endDate: previousSunday,
          startDayIndex: weekStartDayIndex,
          endDayIndex: days.length - 1,
        });
        currentWeekStart = new Date(currentDate);
        weekStartDayIndex = days.length;
        weekNumber++;
      }
      
      // Only add days that are within the challenge date range (compare using date strings)
      const currentDateStr = toDateString(currentDate);
      if (currentDateStr >= startDateStr && currentDateStr <= endDateStr) {
        days.push({
          date: new Date(currentDate),
          dayNumber,
          weekNumber: weekNumber,
        });
        dayNumber++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Always add the last week (it may not have been added if it doesn't end on a Sunday boundary)
    if (days.length > 0) {
      const lastWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;
      if (lastWeek && lastWeek.endDayIndex === days.length - 1) {
        // Last week was already added, just update the end date to match the actual end
        lastWeek.endDate = new Date(weekEnd);
      } else {
        // Need to add the last week
        weeks.push({
          weekNumber: weekNumber,
          startDate: new Date(currentWeekStart),
          endDate: new Date(weekEnd),
          startDayIndex: weekStartDayIndex,
          endDayIndex: days.length - 1,
        });
      }
    }
    
    return { days, weeks };
  };

  const { days: allDays, weeks: allWeeks } = calculateDaysAndWeeks();

  // Helper function for date formatting (defined early as it's used in multiple places)
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // Get selected week from URL or determine default
  const selectedWeekMonday = useMemo(() => {
    const weekParam = searchParams.get('week');
    
    if (weekParam) {
      // Parse the week parameter (should be YYYY-MM-DD format, representing Monday)
      const parsedDate = new Date(weekParam);
      if (!isNaN(parsedDate.getTime())) {
        // Ensure it's a Monday
        const monday = getMonday(parsedDate);
        
        // Validate the week is within challenge date range
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    
        const firstWeekMonday = getMonday(challengeStart);
        firstWeekMonday.setHours(0, 0, 0, 0);
        const lastWeekMonday = getMonday(challengeEnd);
        lastWeekMonday.setHours(0, 0, 0, 0);
        
        // Normalize monday
        monday.setHours(0, 0, 0, 0);
        
        // Clamp to valid range using date string comparison to avoid timezone issues
        const mondayStr = formatDateString(monday);
        const firstWeekStr = formatDateString(firstWeekMonday);
        const lastWeekStr = formatDateString(lastWeekMonday);
        
        let clampedMonday = monday;
        if (mondayStr < firstWeekStr) {
          clampedMonday = firstWeekMonday;
        } else if (mondayStr > lastWeekStr) {
          clampedMonday = lastWeekMonday;
        }
        
        // Get Sunday of the selected week to validate overlap
        const sunday = new Date(clampedMonday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        // Check if the week overlaps with challenge dates
        if (clampedMonday <= challengeEnd && sunday >= challengeStart) {
          return clampedMonday;
        }
      }
    }
    
    // Default: use current week if challenge is ongoing, otherwise last week
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    const now = new Date();
    
    if (now > challengeEnd) {
      // Challenge has ended - use last week
      const lastDayMonday = getMonday(challengeEnd);
      // Find the Monday of the week that contains the challenge end date
      // If challenge ends on a day that's not Sunday, we want that week's Monday
      return lastDayMonday;
    } else {
      // Challenge is ongoing - use current week
      return getMonday(now);
    }
  }, [searchParams, challengeStartDate, challengeEndDate]);

  // Check if we're in the current week - check if today falls within the selected week
  useEffect(() => {
    if (!selectedWeekMonday) {
      setIsCurrentWeek(false);
      return;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekStart = new Date(selectedWeekMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Check if today is within the selected week
    const isCurrent = now >= weekStart && now <= weekEnd;
    setIsCurrentWeek(isCurrent);
  }, [selectedWeekMonday]);

  // Filter days to only show the selected week
  const days = useMemo(() => {
    const weekStart = new Date(selectedWeekMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return allDays.filter(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= weekStart && dayDate <= weekEnd;
    });
  }, [allDays, selectedWeekMonday]);

  // Filter weeks to only show the selected week
  const weeks = useMemo(() => {
    const weekStart = new Date(selectedWeekMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return allWeeks.filter(week => {
      // Check if this week overlaps with the selected week
      return week.startDate <= weekEnd && week.endDate >= weekStart;
    });
  }, [allWeeks, selectedWeekMonday]);

  // Get current week info for navigation
  const currentWeekInfo = useMemo(() => {
    const weekStart = new Date(selectedWeekMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    
    // Check if we're at the first week
    const firstWeekMonday = getMonday(challengeStart);
    firstWeekMonday.setHours(0, 0, 0, 0);
    // Compare dates using string format to avoid timezone/time precision issues
    const weekStartStr = formatDateString(weekStart);
    const firstWeekMondayStr = formatDateString(firstWeekMonday);
    const isFirstWeek = weekStartStr === firstWeekMondayStr;
    
    // Check if we're at the last week
    const lastWeekMonday = getMonday(challengeEnd);
    lastWeekMonday.setHours(0, 0, 0, 0);
    // Compare dates using string format to avoid timezone/time precision issues
    const lastWeekMondayStr = formatDateString(lastWeekMonday);
    const isLastWeek = weekStartStr === lastWeekMondayStr;
    
    // Get the week number from the filtered weeks array (should only have one week)
    const weekNumber = weeks.length > 0 ? weeks[0].weekNumber : 1;
    
    return {
      weekStart,
      weekEnd,
      isFirstWeek,
      isLastWeek,
      weekNumber,
    };
  }, [selectedWeekMonday, challengeStartDate, challengeEndDate, weeks]);

  // Get the value that was active for the majority of the week
  const getMajorityOfWeekValue = <T,>(
    weekStart: Date,
    weekEnd: Date,
    values: Array<{ date: Date; value: T }>,
    defaultValue: T
  ): T => {
    if (values.length === 0) return defaultValue;

    // Create a map to count days for each value
    const valueCounts = new Map<string, number>();
    const valueMap = new Map<string, T>();

    // For each day in the week, determine which value was active
    const currentDate = new Date(weekStart);
    while (currentDate <= weekEnd) {
      // Find the most recent value that was active on this date
      const applicableValue = values
        .filter(v => {
          const vDate = new Date(v.date);
          vDate.setHours(0, 0, 0, 0);
          return vDate <= currentDate;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      const value = applicableValue ? applicableValue.value : defaultValue;
      const valueKey = JSON.stringify(value);
      valueCounts.set(valueKey, (valueCounts.get(valueKey) || 0) + 1);
      valueMap.set(valueKey, value);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Find the value with the most days
    let maxCount = 0;
    let majorityValue = defaultValue;
    valueCounts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        majorityValue = valueMap.get(key) || defaultValue;
      }
    });

    return majorityValue;
  };

  // Get majority-of-week calories for an enrollment
  const getMajorityOfWeekCalories = (enrollment: Enrollment): number | null => {
    if (enrollment.status !== 'onboarded') return null;
    
    const history = enrollmentHistoryData[enrollment.id] || [];
    const weekStart = currentWeekInfo.weekStart;
    const weekEnd = currentWeekInfo.weekEnd;

    // Build values array from enrollment history
    const values: Array<{ date: Date; value: number | null }> = [];
    
    // Add initial enrollment value at challenge start
    if (enrollment.calculated_calories) {
      const challengeStart = new Date(challengeStartDate);
      challengeStart.setHours(0, 0, 0, 0);
      values.push({ date: challengeStart, value: enrollment.calculated_calories });
    }

    // Add history entries
    history.forEach(h => {
      const effectiveDate = new Date(h.effective_date);
      effectiveDate.setHours(0, 0, 0, 0);
      values.push({ date: effectiveDate, value: h.calculated_calories });
    });

    const majorityValue = getMajorityOfWeekValue(
      weekStart,
      weekEnd,
      values,
      enrollment.calculated_calories || null
    );

    return majorityValue;
  };

  // Get majority-of-week macros for an enrollment
  const getMajorityOfWeekMacros = (enrollment: Enrollment): { protein: number; carbs: number; fat: number } | null => {
    if (enrollment.status !== 'onboarded') return null;
    if (!enrollment.protein_percent && !enrollment.carbs_percent && !enrollment.fat_percent) return null;

    const history = enrollmentHistoryData[enrollment.id] || [];
    const weekStart = currentWeekInfo.weekStart;
    const weekEnd = currentWeekInfo.weekEnd;

    // Build values array from enrollment history
    const values: Array<{ date: Date; value: { protein: number; carbs: number; fat: number } }> = [];
    
    // Add initial enrollment value at challenge start
    const defaultMacros = {
      protein: enrollment.protein_percent || 0,
      carbs: enrollment.carbs_percent || 0,
      fat: enrollment.fat_percent || 0,
    };
    if (defaultMacros.protein || defaultMacros.carbs || defaultMacros.fat) {
      const challengeStart = new Date(challengeStartDate);
      challengeStart.setHours(0, 0, 0, 0);
      values.push({ date: challengeStart, value: defaultMacros });
    }

    // Add history entries
    history.forEach(h => {
      const effectiveDate = new Date(h.effective_date);
      effectiveDate.setHours(0, 0, 0, 0);
      values.push({
        date: effectiveDate,
        value: {
          protein: h.protein_percent || 0,
          carbs: h.carbs_percent || 0,
          fat: h.fat_percent || 0,
        },
      });
    });

    const majorityValue = getMajorityOfWeekValue(
      weekStart,
      weekEnd,
      values,
      defaultMacros
    );

    return majorityValue;
  };

  // Get majority-of-week weight for an enrollment
  const getMajorityOfWeekWeight = (enrollment: Enrollment): number | null => {
    if (enrollment.status !== 'onboarded') return null;

    const weightCheckins = weightCheckinsData[enrollment.id] || [];
    const weekStart = currentWeekInfo.weekStart;
    const weekEnd = currentWeekInfo.weekEnd;

    // Filter weight check-ins within or before the week
    const applicableWeights = weightCheckins
      .filter(w => w.weight_kg !== null)
      .map(w => ({
        date: new Date(w.submitted_at),
        value: w.weight_kg as number,
      }))
      .filter(w => {
        const wDate = new Date(w.date);
        wDate.setHours(0, 0, 0, 0);
        return wDate <= weekEnd;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (applicableWeights.length === 0) {
      // Fall back to bodyweight or latest weight
      return getMostRecentWeight(enrollment);
    }

    // Build values array - each weight check-in applies until the next one
    const values: Array<{ date: Date; value: number }> = [];
    
    // Add initial bodyweight at enrollment start if available
    if (enrollment.bodyweight_kg) {
      const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : new Date(challengeStartDate);
      enrollmentStart.setHours(0, 0, 0, 0);
      values.push({ date: enrollmentStart, value: enrollment.bodyweight_kg });
    }

    // Add weight check-ins
    applicableWeights.forEach(w => {
      const wDate = new Date(w.date);
      wDate.setHours(0, 0, 0, 0);
      values.push({ date: wDate, value: w.value });
    });

    const defaultValue = enrollment.bodyweight_kg || getMostRecentWeight(enrollment) || null;
    if (defaultValue === null) return null;

    const majorityValue = getMajorityOfWeekValue(
      weekStart,
      weekEnd,
      values,
      defaultValue
    );

    return majorityValue;
  };

  // Navigation functions
  const navigateToWeek = (targetMonday: Date) => {
    // Validate that the target week is within the challenge bounds
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    
    const firstWeekMonday = getMonday(challengeStart);
    firstWeekMonday.setHours(0, 0, 0, 0);
    const lastWeekMonday = getMonday(challengeEnd);
    lastWeekMonday.setHours(0, 0, 0, 0);
    
    // Normalize target Monday
    const normalizedTarget = new Date(targetMonday);
    normalizedTarget.setHours(0, 0, 0, 0);
    
    // Clamp to valid range using date string comparison to avoid timezone issues
    const targetStr = formatDateString(normalizedTarget);
    const firstWeekStr = formatDateString(firstWeekMonday);
    const lastWeekStr = formatDateString(lastWeekMonday);
    
    let clampedMonday = normalizedTarget;
    if (targetStr < firstWeekStr) {
      clampedMonday = firstWeekMonday;
    } else if (targetStr > lastWeekStr) {
      clampedMonday = lastWeekMonday;
    }
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', formatDateString(clampedMonday));
    router.replace(`/admin/challenges/${challengeId}/participants?${params.toString()}`);
  };

  const goToPreviousWeek = () => {
    if (currentWeekInfo.isFirstWeek) return;
    
    const previousMonday = new Date(selectedWeekMonday);
    previousMonday.setDate(previousMonday.getDate() - 7);
    navigateToWeek(previousMonday);
  };

  const goToNextWeek = () => {
    const nextMonday = new Date(selectedWeekMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    navigateToWeek(nextMonday);
  };

  // Get current date for highlighting and scrolling
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const todayDateStr = formatDateString(today);

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const dateStr = formatDateString(date);
    return dateStr === todayDateStr;
  };

  // Scroll logic removed - only showing one week at a time, so no need to scroll

  // Helper functions for check-in status
  const getCheckinForDate = (enrollmentId: string, date: string): DailyCheckin | undefined => {
    const enrollmentCheckins = checkinsData[enrollmentId];
    if (!enrollmentCheckins) return undefined;
    return enrollmentCheckins[date];
  };

  const isRedDay = (enrollmentId: string, date: string): boolean => {
    const redDays = redDaysData[enrollmentId];
    if (!redDays) return false;
    return redDays.some(rd => {
      const start = new Date(rd.start_date);
      const end = new Date(rd.end_date);
      const checkDate = new Date(date);
      return checkDate >= start && checkDate <= end;
    });
  };

  const getStepsStatus = (checkin: DailyCheckin | undefined, stepGoal: number | null, dateStr: string): 'green' | 'amber' | 'red' | 'none' => {
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    const isFuture = checkDate > today;
    const isToday = checkDate.getTime() === today.getTime();
    
    // Future dates: always grey (no submission yet)
    if (isFuture) return 'none';
    
    // If no submission
    if (!checkin) {
      // Grey if today (no submission yet), red if past (missed submission)
      return isToday ? 'none' : 'red';
    }
    
    // If submission exists, evaluate it normally
    if (stepGoal === null) return 'none'; // Grey if no goal set
    if (checkin.steps === null) return 'amber'; // Amber if submitted but no steps data (incomplete)
    return checkin.steps >= stepGoal ? 'green' : 'amber'; // Amber if submitted but not correct
  };

  const getMacrosStatus = (checkin: DailyCheckin | undefined, enrollment: Enrollment, date: string): 'green' | 'amber' | 'red' | 'none' => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const isFuture = checkDate > today;
    const isToday = checkDate.getTime() === today.getTime();
    
    // Future dates: always grey (no submission yet)
    if (isFuture) return 'none';
    
    // If no submission or incomplete submission
    if (!checkin || checkin.protein_g === null || checkin.carbs_g === null || checkin.fat_g === null) {
      // Grey if today (no submission yet), red if past (missed submission)
      return isToday ? 'none' : 'red';
    }
    if (!enrollment.calculated_calories || enrollment.calculated_calories <= 0) {
      return isToday ? 'none' : 'red';
    }
    if (checkin.calories_consumed === null) {
      return isToday ? 'none' : 'red';
    }

    const targetCalories = enrollment.calculated_calories;
    const targetProtein = (targetCalories * (enrollment.protein_percent || 0) / 100) / 4; // 4 cal per gram
    const targetCarbs = (targetCalories * (enrollment.carbs_percent || 0) / 100) / 4; // 4 cal per gram
    const targetFat = (targetCalories * (enrollment.fat_percent || 0) / 100) / 9; // 9 cal per gram

    const leeway = 0.1; // 10% leeway

    const proteinInRange = checkin.protein_g >= targetProtein * (1 - leeway) && checkin.protein_g <= targetProtein * (1 + leeway);
    const carbsInRange = checkin.carbs_g >= targetCarbs * (1 - leeway) && checkin.carbs_g <= targetCarbs * (1 + leeway);
    const fatInRange = checkin.fat_g >= targetFat * (1 - leeway) && checkin.fat_g <= targetFat * (1 + leeway);
    const allMacrosInRange = proteinInRange && carbsInRange && fatInRange;

    const caloriesInRange = checkin.calories_consumed >= targetCalories * (1 - leeway) && 
                            checkin.calories_consumed <= targetCalories * (1 + leeway);

    if (allMacrosInRange && caloriesInRange) return 'green';
    // Amber if submitted but not correct (either macros or calories wrong)
    return 'amber';
  };

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

  // Get scheduled workout status for a date
  const getScheduledWorkoutStatus = (enrollmentId: string, dateStr: string): 'grey' | 'red' | 'green' | 'unscheduled_completed' | null => {
    const schedules = weeklyWorkoutSchedulesData[enrollmentId] || [];
    const scheduledForDate = schedules.filter(s => s.scheduled_date === dateStr);
    const checkin = checkinsData[enrollmentId]?.[dateStr];
    const workoutIcons = getWorkoutIcons(checkin);
    const hasActualWorkout = workoutIcons.weights || workoutIcons.cardio;
    
    if (scheduledForDate.length === 0) {
      // No scheduled workout for this date
      // Only return status if an actual workout was completed (unplanned workout)
      if (hasActualWorkout) {
        return 'unscheduled_completed'; // Unplanned workout completed - show as green
      }
      return null; // No workout scheduled and no workout done - don't show icon
    }

    // There is a scheduled workout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(dateStr);
    scheduledDate.setHours(0, 0, 0, 0);
    const isPastDue = scheduledDate < today;
    const isToday = scheduledDate.getTime() === today.getTime();

    // If completed with actual workout details, show green
    if (hasActualWorkout) {
      return 'green';
    }

    // If past due and not completed, show red
    if (isPastDue && !isToday) {
      return 'red';
    }

    // Future or today (not completed yet), show grey
    return 'grey';
  };

  // Get scheduled workouts for a date
  const getScheduledWorkoutsForDate = (enrollmentId: string, dateStr: string): Array<{ workout_type: 'weights' | 'cardio' }> => {
    const schedules = weeklyWorkoutSchedulesData[enrollmentId] || [];
    return schedules.filter(s => s.scheduled_date === dateStr);
  };

  const getMostRecentWeight = (enrollment: Enrollment): number | null => {
    const latestWeight = latestWeights[enrollment.id];
    if (latestWeight && latestWeight.weight_kg !== null) {
      return latestWeight.weight_kg;
    }
    return enrollment.bodyweight_kg || null;
  };

  // Helper function to calculate expected date for a physique check-in based on frequency
  // check_in_number 1 is on day 1 (start_date), then spaced by frequency
  const getExpectedPhysiqueDate = (checkInNumber: number, enrollment: Enrollment): Date | null => {
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
    enrollmentStart.setHours(0, 0, 0, 0);
    
    // Determine weeks per check-in based on frequency
    // monthly = 4 weeks, weekly = 1 week, biweekly = 2 weeks (default to weekly)
    const weeksPerCheckin = physiqueFrequency === 'monthly' ? 4 : (physiqueFrequency === 'biweekly' ? 2 : 1);
    
    // Calculate expected date: (check_in_number - 1) * weeksPerCheckin weeks after start_date
    const expectedDate = new Date(enrollmentStart);
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
  const getExpectedWeightDate = (checkInNumber: number, enrollment: Enrollment): Date | null => {
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
    enrollmentStart.setHours(0, 0, 0, 0);
    
    // Determine weeks per check-in based on frequency
    // biweekly = 2 weeks, weekly = 1 week, monthly = 4 weeks (default to weekly)
    const weeksPerCheckin = weightMeasurementFrequency === 'biweekly' ? 2 : (weightMeasurementFrequency === 'monthly' ? 4 : 1);
    
    // Calculate expected date: (check_in_number - 1) * weeksPerCheckin weeks after start_date
    const expectedDate = new Date(enrollmentStart);
    expectedDate.setDate(expectedDate.getDate() + (checkInNumber - 1) * weeksPerCheckin * 7);
    expectedDate.setHours(0, 0, 0, 0);
    
    // Only return if within challenge range
    const challengeEnd = new Date(challengeEndDate);
    challengeEnd.setHours(23, 59, 59, 999);
    if (expectedDate > challengeEnd) return null;
    
    return expectedDate;
  };

  // Helper function to check if physique check-in should be shown and if it's missed (red)
  const getPhysiqueCheckinStatus = (enrollmentId: string, date: string, enrollment: Enrollment): { show: boolean; isMissed: boolean } => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const physiqueCheckins = physiqueCheckinsData[enrollmentId] || [];
    
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
    enrollmentStart.setHours(0, 0, 0, 0);
    
    // Check if this date is an expected check-in date (day 1, then every frequency interval)
    const startDate = enrollmentStart;
    const weeksPerCheckin = physiqueFrequency === 'monthly' ? 4 : (physiqueFrequency === 'biweekly' ? 2 : 1);
    
    // Calculate maximum possible check_in_number (based on days since start and frequency)
    const daysSinceStart = Math.floor((checkDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const maxCheckInNumber = Math.floor(daysSinceStart / (weeksPerCheckin * 7)) + 1;
    
    // Check all possible check-in numbers up to the max
    for (let checkInNum = 1; checkInNum <= maxCheckInNumber; checkInNum++) {
      const expectedDate = new Date(startDate);
      expectedDate.setDate(expectedDate.getDate() + (checkInNum - 1) * weeksPerCheckin * 7);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (expectedDate.getTime() === checkDate.getTime()) {
        // This is an expected check-in date
        // Check if there's a submitted check-in for this check_in_number on any date
        const submittedCheckin = physiqueCheckins.find(p => p.check_in_number === checkInNum);
        
        if (submittedCheckin) {
          // Check-in exists - show it if it has photos
          const hasPhotos = !!(submittedCheckin.front_photo_url || submittedCheckin.back_photo_url || submittedCheckin.side_photo_url);
          if (hasPhotos) {
            // Show on the expected date (check-in exists and has photos)
            return { show: true, isMissed: false };
          } else if (checkDate <= today) {
            // Check-in exists but no photos, and we're at or past the expected date - show as missed
            return { show: true, isMissed: true };
          }
        } else if (checkDate <= today) {
          // No check-in submitted and we're at or past the expected date - show as missed
          return { show: true, isMissed: true };
        }
      }
    }
    
    // Also check if there's a submitted check-in on this date (even if not the expected date)
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
    
    return { show: false, isMissed: false };
  };

  // Helper function to check if weight check-in should be shown and if it's missed (red)
  const getWeightCheckinStatus = (enrollmentId: string, date: string, enrollment: Enrollment): { show: boolean; isMissed: boolean } => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weightCheckins = weightCheckinsData[enrollmentId] || [];
    
    const challengeStart = new Date(challengeStartDate);
    challengeStart.setHours(0, 0, 0, 0);
    const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
    enrollmentStart.setHours(0, 0, 0, 0);
    
    // Check if this date is an expected check-in date (day 1, then every frequency interval)
    const startDate = enrollmentStart;
    const weeksPerCheckin = weightMeasurementFrequency === 'biweekly' ? 2 : (weightMeasurementFrequency === 'monthly' ? 4 : 1);
    
    // Calculate maximum possible check_in_number (based on days since start and frequency)
    const daysSinceStart = Math.floor((checkDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const maxCheckInNumber = Math.floor(daysSinceStart / (weeksPerCheckin * 7)) + 1;
    
    // Check all possible check-in numbers up to the max
    for (let checkInNum = 1; checkInNum <= maxCheckInNumber; checkInNum++) {
      const expectedDate = new Date(startDate);
      expectedDate.setDate(expectedDate.getDate() + (checkInNum - 1) * weeksPerCheckin * 7);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (expectedDate.getTime() === checkDate.getTime()) {
        // This is an expected check-in date
        // Check if there's a submitted check-in for this check_in_number
        const submittedCheckin = weightCheckins.find(w => w.check_in_number === checkInNum);
        
        if (submittedCheckin) {
          // Check-in exists - show it on the expected date
          return { show: true, isMissed: false };
        } else if (checkDate <= today) {
          // No check-in submitted and we're at or past the expected date - show as missed
          return { show: true, isMissed: true };
        }
      }
    }
    
    // Also check if there's a submitted check-in on this date (even if not the expected date)
    const submittedOnThisDate = weightCheckins.some(w => {
      const weightDate = new Date(w.submitted_at);
      weightDate.setHours(0, 0, 0, 0);
      return weightDate.getTime() === checkDate.getTime();
    });
    
    if (submittedOnThisDate) {
      return { show: true, isMissed: false }; // Show on actual submission date, not red
    }
    
    return { show: false, isMissed: false };
  };

  // Legacy helper functions for backward compatibility (simplified)
  const hasPhotos = (enrollmentId: string, date: string): boolean => {
    // This will be replaced with getPhysiqueCheckinStatus in the rendering
    return false; // Not used anymore
  };

  const hasWeightCheckinForDate = (enrollmentId: string, date: string): boolean => {
    // This will be replaced with getWeightCheckinStatus in the rendering
    return false; // Not used anymore
  };

  // Helper functions to check if enrollment matches filter criteria for current week
  const hasMissedSteps = (enrollment: Enrollment): boolean => {
    if (!enrollment.min_steps) return false;
    const enrollmentCheckins = checkinsData[enrollment.id] || {};
    
    // Check each day in the current week
    for (const day of days) {
      const dateStr = formatDateString(new Date(day.date));
      const checkin = enrollmentCheckins[dateStr];
      
      // Only check days that are within challenge date range and after enrollment start
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      const challengeStart = new Date(challengeStartDate);
      challengeStart.setHours(0, 0, 0, 0);
      const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
      enrollmentStart.setHours(0, 0, 0, 0);
      
      if (dayDate < enrollmentStart) continue; // Skip days before enrollment start
      
      // If there's a checkin but steps are below goal, it's a miss
      if (checkin) {
        if (checkin.steps === null || checkin.steps < enrollment.min_steps) {
          return true;
        }
      }
      // If there's no checkin for a day that should have one, consider it a miss
      // (This might be too strict, but matches the requirement)
    }
    return false;
  };

  const hasMissedMacros = (enrollment: Enrollment): boolean => {
    if (!enrollment.calculated_calories || enrollment.calculated_calories <= 0) return false;
    const enrollmentCheckins = checkinsData[enrollment.id] || {};
    
    // Check each day in the current week
    for (const day of days) {
      const dateStr = formatDateString(new Date(day.date));
      const checkin = enrollmentCheckins[dateStr];
      
      // Only check days that are within challenge date range and after enrollment start
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      const challengeStart = new Date(challengeStartDate);
      challengeStart.setHours(0, 0, 0, 0);
      const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
      enrollmentStart.setHours(0, 0, 0, 0);
      
      if (dayDate < enrollmentStart) continue; // Skip days before enrollment start
      
      if (checkin && checkin.protein_g !== null && checkin.carbs_g !== null && checkin.fat_g !== null && checkin.calories_consumed !== null) {
        const macrosStatus = getMacrosStatus(checkin, enrollment, dateStr);
        // If macros are not within 10% (red or amber), it's a miss
        if (macrosStatus !== 'green') {
          return true;
        }
      }
    }
    return false;
  };

  const hasMissedWorkouts = (enrollment: Enrollment): boolean => {
    const enrollmentCheckins = checkinsData[enrollment.id] || {};
    
    // Check each day in the current week
    for (const day of days) {
      const dateStr = formatDateString(new Date(day.date));
      const checkin = enrollmentCheckins[dateStr];
      
      // Only check days that are within challenge date range and after enrollment start
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      const challengeStart = new Date(challengeStartDate);
      challengeStart.setHours(0, 0, 0, 0);
      const challengeEnd = new Date(challengeEndDate);
      challengeEnd.setHours(23, 59, 59, 999);
      const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
      enrollmentStart.setHours(0, 0, 0, 0);
      
      if (dayDate < enrollmentStart || dayDate > challengeEnd) continue; // Skip days outside enrollment period
      
      const workoutIcons = getWorkoutIcons(checkin);
      // If no workout completed, it's a miss
      if (!checkin || !checkin.workout_completed || (!workoutIcons.weights && !workoutIcons.cardio)) {
        return true;
      }
    }
    return false;
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = getUserName(enrollment.user).toLowerCase();
    const matchesSearch = userName.includes(searchLower);
    
    if (!matchesSearch) return false;
    
    // Apply filters
    if (filterMissedSteps && !hasMissedSteps(enrollment)) return false;
    if (filterMissedMacros && !hasMissedMacros(enrollment)) return false;
    if (filterMissedWorkouts && !hasMissedWorkouts(enrollment)) return false;
    
    return true;
  });

  // Separate pending and onboarded participants
  // Handle case where status might be null/undefined - treat as onboarded by default (legacy data)
  const pendingEnrollments = filteredEnrollments
    .filter(e => e.status === 'pending')
    .sort((a, b) => {
      const aFirstName = (a.user?.first_name || '').toLowerCase();
      const bFirstName = (b.user?.first_name || '').toLowerCase();
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName);
      }
      const aLastName = (a.user?.last_name || '').toLowerCase();
      const bLastName = (b.user?.last_name || '').toLowerCase();
      return aLastName.localeCompare(bLastName);
    });
  const onboardedEnrollments = filteredEnrollments.filter(e => e.status === 'onboarded');
  
  // If there are enrollments that don't match either status (null, undefined, or other), add them to onboarded
  const otherEnrollments = filteredEnrollments.filter(e => 
    e.status !== 'pending' && 
    e.status !== 'onboarded'
  );
  
  // Add other enrollments to onboarded for display (treat null/undefined as onboarded)
  const allOnboardedEnrollments = [...onboardedEnrollments, ...otherEnrollments]
    .sort((a, b) => {
      const aFirstName = (a.user?.first_name || '').toLowerCase();
      const bFirstName = (b.user?.first_name || '').toLowerCase();
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName);
      }
      const aLastName = (a.user?.last_name || '').toLowerCase();
      const bLastName = (b.user?.last_name || '').toLowerCase();
      return aLastName.localeCompare(bLastName);
    });
  
  // Filter based on statusFilter prop
  const displayPending = statusFilter === 'all' || statusFilter === 'pending';
  const displayOnboarded = statusFilter === 'all' || statusFilter === 'onboarded';

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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading participants...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <SearchInput
            placeholder="Search participants..."
            value={searchTerm}
            onChange={setSearchTerm}
            style={{ maxWidth: '500px' }}
          />
          </div>
        </div>
        
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={filterMissedSteps}
              onChange={(e) => setFilterMissedSteps(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span>Missed Steps</span>
          </label>
          
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={filterMissedMacros}
              onChange={(e) => setFilterMissedMacros(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span>Missed Macros (10%)</span>
          </label>
          
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={filterMissedWorkouts}
              onChange={(e) => setFilterMissedWorkouts(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span>Missed Workouts</span>
          </label>
        </div>
      </div>

      {/* Pending Participants Section */}
      {displayPending && pendingEnrollments.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            Pending Participants ({pendingEnrollments.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingEnrollments.map((enrollment) => {
              const statusColor = '#FF9500';
              return (
                <div
                  key={enrollment.id}
                  className="card"
                  style={{
                    background: '#1a1a1a',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '20px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {enrollment.user?.avatar_url ? (
                        <img
                          src={enrollment.user.avatar_url}
                          alt={getUserName(enrollment.user)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {getUserName(enrollment.user)
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#FFFFFF',
                            }}
                          >
                            {getUserName(enrollment.user)}
                          </h3>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: `${statusColor}20`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`,
                              textTransform: 'capitalize',
                            }}
                          >
                            {enrollment.status}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: 'rgba(235, 235, 245, 0.6)',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#FFFFFF' }}>Enrolled:</strong>{' '}
                            {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => router.push(`/admin/challenges/${challengeId}/participants/${enrollment.user_id}`)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Approve this enrollment?')) return;
                          try {
                            const response = await fetch(
                              `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}/approve`,
                              { method: 'POST' }
                            );
                            if (!response.ok) throw new Error('Failed to approve enrollment');
                            fetchEnrollments();
                          } catch (error) {
                            console.error('Error approving enrollment:', error);
                            alert('Failed to approve enrollment');
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#34C759',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Reject this enrollment? This will delete the enrollment.')) return;
                          try {
                            const response = await fetch(
                              `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}`,
                              { method: 'DELETE' }
                            );
                            if (!response.ok) throw new Error('Failed to reject enrollment');
                            fetchEnrollments();
                          } catch (error) {
                            console.error('Error rejecting enrollment:', error);
                            alert('Failed to reject enrollment');
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#FF3B30',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboarded Participants Table */}
      {displayOnboarded && allOnboardedEnrollments.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF',
                margin: 0,
            }}
          >
            {statusFilter === 'onboarded' ? 'Participants' : `Onboarded Participants (${allOnboardedEnrollments.length})`}
            {statusFilter === 'onboarded' && ` (${allOnboardedEnrollments.length})`}
          </h2>
            {/* Week Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <button
                onClick={currentWeekInfo.isFirstWeek ? undefined : goToPreviousWeek}
                disabled={currentWeekInfo.isFirstWeek}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: currentWeekInfo.isFirstWeek
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: currentWeekInfo.isFirstWeek
                    ? 'rgba(255, 255, 255, 0.3)'
                    : '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentWeekInfo.isFirstWeek ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: currentWeekInfo.isFirstWeek ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!currentWeekInfo.isFirstWeek) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!currentWeekInfo.isFirstWeek) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                ← Previous Week
              </button>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                Week {currentWeekInfo.weekNumber} |{' '}
                {currentWeekInfo.weekStart.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {currentWeekInfo.weekEnd.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <button
                onClick={goToNextWeek}
                disabled={currentWeekInfo.isLastWeek}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: currentWeekInfo.isLastWeek
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: currentWeekInfo.isLastWeek
                    ? 'rgba(255, 255, 255, 0.3)'
                    : '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentWeekInfo.isLastWeek ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: currentWeekInfo.isLastWeek ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!currentWeekInfo.isLastWeek) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!currentWeekInfo.isLastWeek) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                Next Week →
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={() => {
                    const now = new Date();
                    const currentWeekMonday = getMonday(now);
                    navigateToWeek(currentWeekMonday);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                    background: 'rgba(0, 122, 255, 0.1)',
                    color: '#007AFF',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.3)';
                  }}
                >
                  Jump to Current Week
                </button>
              )}
              {isCurrentWeek && challengeMultiplier !== null && (
                <>
                  {!isEditMode ? (
                    <button
                      onClick={() => {
                        // Initialize edit data for all enrollments
                        const initialEditData: Record<string, any> = {};
                        allOnboardedEnrollments.forEach(enrollment => {
                          const initialCalories = enrollment.bodyweight_kg 
                            ? Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier)
                            : 0;
                          const adjustment = enrollment.calorie_adjustment !== undefined && enrollment.calorie_adjustment !== null
                            ? enrollment.calorie_adjustment
                            : (enrollment.calculated_calories ? enrollment.calculated_calories - initialCalories : 0);
                          const totalCalories = enrollment.calculated_calories || initialCalories + adjustment;
                          
                          initialEditData[enrollment.id] = {
                            adjustment,
                            totalCalories,
                            proteinPercent: enrollment.protein_percent || 0,
                            carbsPercent: enrollment.carbs_percent || 0,
                            fatPercent: enrollment.fat_percent || 0,
                          };
                        });
                        setEditData(initialEditData);
                        setIsEditMode(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#007AFF',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#0051D5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#007AFF';
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {(() => {
                        // Check if any macros don't equal 100%
                        const hasMacroErrors = Object.values(editData).some(edit => {
                          const sum = edit.proteinPercent + edit.carbsPercent + edit.fatPercent;
                          return Math.abs(sum - 100) > 0.01;
                        });
                        
                        return (
                          <>
                            {hasMacroErrors && (
                              <span style={{ fontSize: '12px', color: '#FF3B30', marginRight: '8px' }}>
                                Fix macro percentages (must equal 100%)
                              </span>
                            )}
                            <button
                              onClick={async () => {
                                // Validate all macros
                                const hasErrors = Object.values(editData).some(edit => {
                                  const sum = edit.proteinPercent + edit.carbsPercent + edit.fatPercent;
                                  return Math.abs(sum - 100) > 0.01;
                                });
                                
                                if (hasErrors) {
                                  alert('Please fix all macro percentages to equal 100% before saving');
                                  return;
                                }

                                try {
                                  const updates = allOnboardedEnrollments.map(enrollment => {
                                    const edit = editData[enrollment.id];
                                    return fetch(
                                      `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}`,
                                      {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          calorie_adjustment: edit.adjustment,
                                          protein_percent: edit.proteinPercent,
                                          carbs_percent: edit.carbsPercent,
                                          fat_percent: edit.fatPercent,
                                        }),
                                      }
                                    );
                                  });

                                  await Promise.all(updates);
                                  await fetchEnrollments();
                                  setIsEditMode(false);
                                  setEditData({});
                                } catch (error) {
                                  console.error('Error updating enrollments:', error);
                                  alert('Failed to update enrollments');
                                }
                              }}
                              disabled={hasMacroErrors}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: hasMacroErrors ? 'rgba(52, 199, 89, 0.3)' : '#34C759',
                                color: '#FFFFFF',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: hasMacroErrors ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: hasMacroErrors ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!hasMacroErrors) {
                                  e.currentTarget.style.background = '#28A745';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!hasMacroErrors) {
                                  e.currentTarget.style.background = '#34C759';
                                }
                              }}
                            >
                              Save
                            </button>
                          </>
                        );
                      })()}
                      <button
                        onClick={() => {
                          setIsEditMode(false);
                          setEditData({});
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div
            ref={tableScrollRef}
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '70vh',
            }}
          >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: `${180 + 100 + (isEditMode ? 200 : 100) + 120 + (days.length * 60)}px`, // Participant + Weight + Calories (wider in edit mode) + Macros + days
            }}
          >
            {/* Day Header Row */}
            <thead>
              <tr
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <th
                  style={{
                    padding: '8px 20px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(235, 235, 245, 0.7)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: 0,
                    background: '#1a1a1a',
                    zIndex: 11,
                    minWidth: '180px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Participant
                </th>
                  <th
                    style={{
                    padding: '8px 12px',
                      textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(235, 235, 245, 0.7)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: '180px',
                    background: '#1a1a1a',
                    zIndex: 11,
                    minWidth: '100px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Weight
                </th>
                    <th
                      style={{
                    padding: '8px 12px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                    color: 'rgba(235, 235, 245, 0.7)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: '280px',
                    background: '#1a1a1a',
                    zIndex: 11,
                    minWidth: '100px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Calories
                    </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'rgba(235, 235, 245, 0.7)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: '380px',
                    background: '#1a1a1a',
                    zIndex: 11,
                    minWidth: '120px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Macros % (P/C/F)
                </th>
                {days.map((day) => {
                  const dayOfWeek = day.date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                  const weekdayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek];
                  const dayNumber = day.date.getDate();
                  const isTodayDate = isToday(day.date);
                  
                  return (
                    <th
                      key={day.dayNumber}
                      style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: isTodayDate ? '#007AFF' : 'rgba(255, 255, 255, 0.7)',
                        minWidth: '60px',
                        width: '60px',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
                        background: isTodayDate ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: isTodayDate ? '700' : '600' }}>
                          {dayNumber}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '400',
                            color: isTodayDate ? '#007AFF' : 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          {weekdayLetter}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {/* Body Rows */}
            <tbody>
              {allOnboardedEnrollments.map((enrollment) => {
                return (
                  <tr
                    key={enrollment.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Participant Name Column */}
                    <td
                      style={{
                        padding: '10px 12px',
                        position: 'sticky',
                        left: 0,
                        background: '#1a1a1a',
                        zIndex: 9,
                        minWidth: '180px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        {enrollment.user?.avatar_url ? (
                          <img
                            src={enrollment.user.avatar_url}
                            alt={getUserName(enrollment.user)}
                            onClick={() => {
                              router.push(`/admin/challenges/${challengeId}/participants/${enrollment.user_id}`);
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => {
                              router.push(`/admin/challenges/${challengeId}/participants/${enrollment.user_id}`);
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'rgba(255, 255, 255, 0.7)',
                              cursor: 'pointer',
                            }}
                          >
                            {getUserName(enrollment.user)
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div 
                          onClick={() => {
                            router.push(`/admin/challenges/${challengeId}/participants/${enrollment.user_id}`);
                          }}
                          style={{ 
                            flex: 1,
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#FFFFFF',
                            }}
                          >
                            {getUserName(enrollment.user)}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Weight Column */}
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        position: 'sticky',
                        left: '180px',
                        background: '#1a1a1a',
                        zIndex: 9,
                        minWidth: '100px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {(() => {
                        const majorityWeight = getMajorityOfWeekWeight(enrollment);
                        return majorityWeight !== null ? (
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                            {majorityWeight.toFixed(1)}kg
                        </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.3)' }}>-</div>
                        );
                      })()}
                    </td>
                    {/* Calories Column */}
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        position: 'sticky',
                        left: '280px',
                        background: '#1a1a1a',
                        zIndex: 9,
                        minWidth: isEditMode ? '200px' : '100px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {isEditMode && challengeMultiplier !== null && editData[enrollment.id] ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                            {/* Calculated Value (Read-only) */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>Calc</div>
                              <div
                                style={{
                                  padding: '4px 6px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '4px',
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textAlign: 'center',
                                }}
                              >
                                {(() => {
                                  const initialCalories = enrollment.bodyweight_kg 
                                    ? Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier)
                                    : 0;
                                  return initialCalories;
                                })()}
                              </div>
                            </div>
                            {/* Adjustment (Editable) */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>Adj</div>
                              <input
                                type="number"
                                value={editData[enrollment.id].adjustment}
                                onChange={(e) => {
                                  const newAdjustment = Number(e.target.value) || 0;
                                  const initialCalories = enrollment.bodyweight_kg 
                                    ? Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier)
                                    : 0;
                                  const newTotal = initialCalories + newAdjustment;
                                  setEditData({
                                    ...editData,
                                    [enrollment.id]: {
                                      ...editData[enrollment.id],
                                      adjustment: newAdjustment,
                                      totalCalories: Math.round(newTotal),
                                    },
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '4px',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textAlign: 'center',
                                }}
                                className="no-spinner"
                              />
                            </div>
                            {/* Total (Editable) */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>Total</div>
                              <input
                                type="number"
                                value={editData[enrollment.id].totalCalories}
                                onChange={(e) => {
                                  const newTotal = Number(e.target.value) || 0;
                                  const initialCalories = enrollment.bodyweight_kg 
                                    ? Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier)
                                    : 0;
                                  const newAdjustment = newTotal - initialCalories;
                                  setEditData({
                                    ...editData,
                                    [enrollment.id]: {
                                      ...editData[enrollment.id],
                                      totalCalories: newTotal,
                                      adjustment: Math.round(newAdjustment),
                                    },
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '4px',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textAlign: 'center',
                                }}
                                className="no-spinner"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const majorityCalories = getMajorityOfWeekCalories(enrollment);
                          return majorityCalories !== null ? (
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                              {majorityCalories}
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.3)' }}>-</div>
                          );
                        })()
                      )}
                    </td>
                    {/* Macros Column */}
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        position: 'sticky',
                        left: '380px',
                        background: '#1a1a1a',
                        zIndex: 9,
                        minWidth: '120px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {isEditMode && editData[enrollment.id] ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            <input
                              type="number"
                              value={editData[enrollment.id].proteinPercent}
                              onChange={(e) => {
                                setEditData({
                                  ...editData,
                                  [enrollment.id]: {
                                    ...editData[enrollment.id],
                                    proteinPercent: Number(e.target.value) || 0,
                                  },
                                });
                              }}
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="P"
                              style={{
                                flex: 1,
                                padding: '3px 4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                textAlign: 'center',
                              }}
                              className="no-spinner"
                            />
                            <input
                              type="number"
                              value={editData[enrollment.id].carbsPercent}
                              onChange={(e) => {
                                setEditData({
                                  ...editData,
                                  [enrollment.id]: {
                                    ...editData[enrollment.id],
                                    carbsPercent: Number(e.target.value) || 0,
                                  },
                                });
                              }}
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="C"
                              style={{
                                flex: 1,
                                padding: '3px 4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                textAlign: 'center',
                              }}
                              className="no-spinner"
                            />
                            <input
                              type="number"
                              value={editData[enrollment.id].fatPercent}
                              onChange={(e) => {
                                setEditData({
                                  ...editData,
                                  [enrollment.id]: {
                                    ...editData[enrollment.id],
                                    fatPercent: Number(e.target.value) || 0,
                                  },
                                });
                              }}
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="F"
                              style={{
                                flex: 1,
                                padding: '3px 4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                textAlign: 'center',
                              }}
                              className="no-spinner"
                            />
                          </div>
                          {(() => {
                            const sum = editData[enrollment.id].proteinPercent + editData[enrollment.id].carbsPercent + editData[enrollment.id].fatPercent;
                            const isValid = Math.abs(sum - 100) <= 0.01;
                            return (
                              <div style={{ 
                                fontSize: '9px', 
                                color: isValid ? 'rgba(255, 255, 255, 0.5)' : '#FF3B30',
                                textAlign: 'center',
                              }}>
                                {sum.toFixed(1)}%
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        (() => {
                          const majorityMacros = getMajorityOfWeekMacros(enrollment);
                          return majorityMacros !== null ? (
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                              {majorityMacros.protein.toFixed(0)}/{majorityMacros.carbs.toFixed(0)}/{majorityMacros.fat.toFixed(0)}
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.3)' }}>-</div>
                          );
                        })()
                      )}
                    </td>
                    {/* Date Cells */}
                    {days.map((day) => {
                      const dateStr = formatDateString(day.date);
                      const checkin = getCheckinForDate(enrollment.id, dateStr);
                      const isRed = isRedDay(enrollment.id, dateStr);
                      const hasCheckin = !!checkin;
                      const isTodayDate = isToday(day.date);
                      
                      // Show icons only for days within the challenge date range AND after enrollment start
                      const dayDate = new Date(dateStr);
                      dayDate.setHours(0, 0, 0, 0);
                      const challengeStart = new Date(challengeStartDate);
                      challengeStart.setHours(0, 0, 0, 0);
                      const challengeEnd = new Date(challengeEndDate);
                      challengeEnd.setHours(23, 59, 59, 999);
                      const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
                      enrollmentStart.setHours(0, 0, 0, 0);
                      
                      // Show icons only for days in the challenge range AND on or after enrollment start
                      const shouldShowIcons = dayDate >= challengeStart && dayDate <= challengeEnd && dayDate >= enrollmentStart;
                      
                      const stepsStatus = shouldShowIcons ? getStepsStatus(checkin, enrollment.min_steps || null, dateStr) : 'none';
                      const macrosStatus = shouldShowIcons ? getMacrosStatus(checkin, enrollment, dateStr) : 'none';
                      const workoutIcons = shouldShowIcons ? getWorkoutIcons(checkin) : { weights: false, cardio: false };
                      const scheduledWorkoutStatus = shouldShowIcons ? getScheduledWorkoutStatus(enrollment.id, dateStr) : null;
                      const scheduledWorkouts = shouldShowIcons ? getScheduledWorkoutsForDate(enrollment.id, dateStr) : [];
                      const physiqueStatus = shouldShowIcons ? getPhysiqueCheckinStatus(enrollment.id, dateStr, enrollment) : { show: false, isMissed: false };
                      const weightStatus = shouldShowIcons ? getWeightCheckinStatus(enrollment.id, dateStr, enrollment) : { show: false, isMissed: false };

                      // Determine cell background color - red days take precedence over today highlighting
                      let cellBgColor = 'transparent';
                      
                      if (isRed) {
                        // Red days take precedence - show red background if it was marked as a red day
                        cellBgColor = 'rgba(255, 59, 48, 0.2)';
                      } else if (isTodayDate) {
                        // Highlight today only if it's not a red day
                        cellBgColor = 'rgba(0, 122, 255, 0.1)';
                      }

                      return (
                        <td
                          key={day.dayNumber}
                          style={{
                            padding: '6px 4px',
                            textAlign: 'center',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
                            backgroundColor: cellBgColor,
                            minWidth: '60px',
                            width: '60px',
                            cursor: 'default',
                            position: 'relative',
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: '40px',
                          }}>
                            {shouldShowIcons ? (
                              <>
                                {/* Steps Icon - red if no submission, amber if submitted but incorrect, green if correct */}
                                  <WalkIcon 
                                    width={16} 
                                    height={16} 
                                    style={{ 
                                      color: stepsStatus === 'green' 
                                        ? '#34C759' 
                                        : stepsStatus === 'amber' 
                                        ? '#FF9500' 
                                        : stepsStatus === 'red' 
                                        ? '#FF3B30' 
                                        : 'rgba(255, 255, 255, 0.3)' 
                                    }} 
                                  />
                                
                                {/* Macros Icon - red if no submission, amber if submitted but incorrect, green if correct */}
                                  <NutritionIcon 
                                    width={16} 
                                    height={16} 
                                    style={{ 
                                      color: macrosStatus === 'green' 
                                        ? '#34C759' 
                                        : macrosStatus === 'amber' 
                                        ? '#FF9500' 
                                        : macrosStatus === 'red' 
                                        ? '#FF3B30' 
                                        : 'rgba(255, 255, 255, 0.3)' 
                                    }} 
                                  />
                                
                                {/* Workout Icons - show planned sessions or completed workouts */}
                                {(() => {
                                  const hasScheduledWorkout = scheduledWorkouts.length > 0;
                                  
                                  if (hasScheduledWorkout) {
                                    // Show scheduled workout status with icons
                                    const workoutTypes = scheduledWorkouts.map(w => w.workout_type);
                                    const hasWeights = workoutTypes.includes('weights');
                                    const hasCardio = workoutTypes.includes('cardio');
                                    
                                    let statusColor = 'rgba(255, 255, 255, 0.3)'; // grey default
                                    if (scheduledWorkoutStatus === 'green') {
                                      statusColor = '#34C759'; // completed
                                    } else if (scheduledWorkoutStatus === 'red') {
                                      statusColor = '#FF3B30'; // missed/past due
                                    } else if (scheduledWorkoutStatus === 'grey') {
                                      statusColor = 'rgba(255, 255, 255, 0.3)'; // future/today not completed
                                    }
                                    
                                    return (
                                      <>
                                        {hasWeights && (
                                          <BarbellIcon width={16} height={16} style={{ color: statusColor }} />
                                        )}
                                        {hasCardio && (
                                          <FitnessIcon width={16} height={16} style={{ color: statusColor }} />
                                        )}
                                      </>
                                    );
                                  } else if (scheduledWorkoutStatus === 'unscheduled_completed') {
                                    // Unplanned workout completed on a free day - show as green
                                    return (
                                      <>
                                        {workoutIcons.weights && (
                                          <BarbellIcon width={16} height={16} style={{ color: '#34C759' }} />
                                        )}
                                        {workoutIcons.cardio && (
                                          <FitnessIcon width={16} height={16} style={{ color: '#34C759' }} />
                                        )}
                                      </>
                                    );
                                  }
                                  // No scheduled workout and no workout completed - don't show any icons
                                  return null;
                                })()}
                                
                                {/* Photo Icon - show if physique check-in was submitted or is due (red if missed) */}
                                {physiqueStatus.show && (
                                    <CameraIcon width={16} height={16} style={{ color: physiqueStatus.isMissed ? '#FF3B30' : '#007AFF' }} />
                                )}
                                
                                {/* Scales Icon - show if weight check-in was done or is due (red if missed) */}
                                {weightStatus.show && (
                                    <ScalesIcon width={16} height={16} style={{ color: weightStatus.isMissed ? '#FF3B30' : '#5856D6' }} />
                                )}
                              </>
                            ) : (
                              <div style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '10px' }}>-</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* No Results Message - Only show if no enrollments at all */}
      {!loading && enrollments.length === 0 && (
        <div
          className="card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            No participants found.
          </p>
        </div>
      )}
      
      {/* No Results After Search - Only show if search filtered everything out */}
      {!loading && enrollments.length > 0 && pendingEnrollments.length === 0 && allOnboardedEnrollments.length === 0 && searchTerm && (
        <div
          className="card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            No participants found matching your search.
          </p>
        </div>
      )}

      {/* Results Count */}
      {filteredEnrollments.length > 0 && (
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
          Showing <strong style={{ color: '#FFFFFF' }}>{filteredEnrollments.length}</strong> of{' '}
          <strong style={{ color: '#FFFFFF' }}>{enrollments.length}</strong> participants
          {pendingEnrollments.length > 0 && (
            <span style={{ marginLeft: '12px' }}>
              ({pendingEnrollments.length} pending, {allOnboardedEnrollments.length} onboarded)
            </span>
          )}
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {editingEnrollment && challengeMultiplier !== null && (
        editingEnrollment.id ? (
          <EditEnrollmentModal
            enrollment={editingEnrollment}
            challengeId={challengeId}
            challengeMultiplier={challengeMultiplier}
            onClose={() => setEditingEnrollment(null)}
            onSave={async () => {
              await fetchEnrollments();
              setEditingEnrollment(null);
            }}
          />
        ) : (
          <BulkEditModal
            enrollments={allOnboardedEnrollments}
            challengeId={challengeId}
            challengeMultiplier={challengeMultiplier}
            onClose={() => setEditingEnrollment(null)}
            onSave={async () => {
              await fetchEnrollments();
              setEditingEnrollment(null);
            }}
          />
        )
      )}
    </div>
  );
}

// Edit Enrollment Modal Component
interface EditEnrollmentModalProps {
  enrollment: Enrollment;
  challengeId: string;
  challengeMultiplier: number;
  onClose: () => void;
  onSave: () => void;
}

function EditEnrollmentModal({ enrollment, challengeId, challengeMultiplier, onClose, onSave }: EditEnrollmentModalProps) {
  const [initialCalories] = useState<number>(() => {
    if (!enrollment.bodyweight_kg) return 0;
    return Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier);
  });
  const [adjustment, setAdjustment] = useState<number>(() => {
    // Use calorie_adjustment if available, otherwise calculate from calculated_calories
    if (enrollment.calorie_adjustment !== undefined && enrollment.calorie_adjustment !== null) {
      return enrollment.calorie_adjustment;
    }
    // Calculate current adjustment from calculated_calories and initial
    if (enrollment.calculated_calories && enrollment.bodyweight_kg) {
      const initial = Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier);
      return enrollment.calculated_calories - initial;
    }
    return 0;
  });
  const [totalCalories, setTotalCalories] = useState<number>(() => {
    if (enrollment.calculated_calories) {
      return enrollment.calculated_calories;
    }
    return initialCalories + adjustment;
  });
  const [editingTotal, setEditingTotal] = useState(false);
  const [proteinPercent, setProteinPercent] = useState<number>(enrollment.protein_percent || 0);
  const [carbsPercent, setCarbsPercent] = useState<number>(enrollment.carbs_percent || 0);
  const [fatPercent, setFatPercent] = useState<number>(enrollment.fat_percent || 0);
  const [saving, setSaving] = useState(false);
  const [macroError, setMacroError] = useState<string>('');

  // Recalculate when adjustment or total changes
  useEffect(() => {
    if (!editingTotal) {
      // If editing adjustment, calculate total
      const newTotal = initialCalories + adjustment;
      setTotalCalories(Math.round(newTotal));
    }
  }, [adjustment, editingTotal, initialCalories]);

  // When total changes and we're editing total, update adjustment
  const handleTotalChange = (newTotal: number) => {
    setTotalCalories(newTotal);
    const newAdjustment = newTotal - initialCalories;
    setAdjustment(Math.round(newAdjustment));
  };

  // When adjustment changes and we're editing adjustment, update total
  const handleAdjustmentChange = (newAdjustment: number) => {
    setAdjustment(newAdjustment);
    const newTotal = initialCalories + newAdjustment;
    setTotalCalories(Math.round(newTotal));
  };

  // Validate macros sum to 100%
  useEffect(() => {
    const sum = proteinPercent + carbsPercent + fatPercent;
    if (Math.abs(sum - 100) > 0.01) {
      setMacroError(`Macros must equal 100% (currently ${sum.toFixed(1)}%)`);
    } else {
      setMacroError('');
    }
  }, [proteinPercent, carbsPercent, fatPercent]);

  const handleSave = async () => {
    if (macroError) {
      alert('Please fix macro percentages to equal 100%');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calorie_adjustment: adjustment,
            protein_percent: proteinPercent,
            carbs_percent: carbsPercent,
            fat_percent: fatPercent,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update enrollment');
      }

      onSave();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert(error instanceof Error ? error.message : 'Failed to update enrollment');
    } finally {
      setSaving(false);
    }
  };

  return (
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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
            Edit {enrollment.user?.first_name} {enrollment.user?.last_name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
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

        {/* Calories Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
            Calories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Initial Calories
              </label>
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                }}
              >
                {initialCalories} (calculated from bodyweight)
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Adjustment
              </label>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => {
                  setEditingTotal(false);
                  handleAdjustmentChange(Number(e.target.value) || 0);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Total Calories
              </label>
              <input
                type="number"
                value={totalCalories}
                onChange={(e) => {
                  setEditingTotal(true);
                  handleTotalChange(Number(e.target.value) || 0);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Macros Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
            Macro Split (%)
          </h3>
          {macroError && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '8px', color: '#FF3B30', fontSize: '13px' }}>
              {macroError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Protein %
              </label>
              <input
                type="number"
                value={proteinPercent}
                onChange={(e) => setProteinPercent(Number(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Carbs %
              </label>
              <input
                type="number"
                value={carbsPercent}
                onChange={(e) => setCarbsPercent(Number(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Fat %
              </label>
              <input
                type="number"
                value={fatPercent}
                onChange={(e) => setFatPercent(Number(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Total: {(proteinPercent + carbsPercent + fatPercent).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !!macroError}
            style={{
              padding: '10px 20px',
              background: macroError ? 'rgba(255, 59, 48, 0.2)' : '#007AFF',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving || macroError ? 'not-allowed' : 'pointer',
              opacity: saving || macroError ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk Edit Modal Component
interface BulkEditModalProps {
  enrollments: Enrollment[];
  challengeId: string;
  challengeMultiplier: number;
  onClose: () => void;
  onSave: () => void;
}

function BulkEditModal({ enrollments, challengeId, challengeMultiplier, onClose, onSave }: BulkEditModalProps) {
  const getUserName = (user: Enrollment['user']) => {
    if (!user) return 'Unknown User';
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (user.nickname) return user.nickname;
    return 'Unknown User';
  };

  const [edits, setEdits] = useState<Record<string, {
    adjustment: number;
    totalCalories: number;
    editingTotal: boolean;
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
    macroError: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    enrollments.forEach(enrollment => {
      const initialCalories = enrollment.bodyweight_kg 
        ? Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier)
        : 0;
      const adjustment = enrollment.calorie_adjustment !== undefined && enrollment.calorie_adjustment !== null
        ? enrollment.calorie_adjustment
        : (enrollment.calculated_calories ? enrollment.calculated_calories - initialCalories : 0);
      const totalCalories = enrollment.calculated_calories || initialCalories + adjustment;
      
      initial[enrollment.id] = {
        adjustment,
        totalCalories,
        editingTotal: false,
        proteinPercent: enrollment.protein_percent || 0,
        carbsPercent: enrollment.carbs_percent || 0,
        fatPercent: enrollment.fat_percent || 0,
        macroError: '',
      };
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  // Validate macros for each enrollment
  useEffect(() => {
    const updated = { ...edits };
    Object.keys(updated).forEach(enrollmentId => {
      const edit = updated[enrollmentId];
      const sum = edit.proteinPercent + edit.carbsPercent + edit.fatPercent;
      if (Math.abs(sum - 100) > 0.01) {
        edit.macroError = `Macros must equal 100% (currently ${sum.toFixed(1)}%)`;
      } else {
        edit.macroError = '';
      }
    });
    setEdits(updated);
  }, [edits]);

  const handleAdjustmentChange = (enrollmentId: string, newAdjustment: number, initialCalories: number) => {
    const edit = edits[enrollmentId];
    const newTotal = initialCalories + newAdjustment;
    setEdits({
      ...edits,
      [enrollmentId]: {
        ...edit,
        adjustment: newAdjustment,
        totalCalories: Math.round(newTotal),
        editingTotal: false,
      },
    });
  };

  const handleTotalChange = (enrollmentId: string, newTotal: number, initialCalories: number) => {
    const edit = edits[enrollmentId];
    const newAdjustment = newTotal - initialCalories;
    setEdits({
      ...edits,
      [enrollmentId]: {
        ...edit,
        adjustment: Math.round(newAdjustment),
        totalCalories: newTotal,
        editingTotal: true,
      },
    });
  };

  const handleSave = async () => {
    // Check for macro errors
    const hasErrors = Object.values(edits).some(edit => !!edit.macroError);
    if (hasErrors) {
      alert('Please fix all macro percentage errors before saving');
      return;
    }

    setSaving(true);
    try {
      const updates = enrollments.map(enrollment => {
        const edit = edits[enrollment.id];
        return fetch(
          `/api/admin/challenges/${challengeId}/enrollments/${enrollment.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              calorie_adjustment: edit.adjustment,
              protein_percent: edit.proteinPercent,
              carbs_percent: edit.carbsPercent,
              fat_percent: edit.fatPercent,
            }),
          }
        );
      });

      await Promise.all(updates);
      onSave();
    } catch (error) {
      console.error('Error updating enrollments:', error);
      alert('Failed to update enrollments');
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.values(edits).some(edit => !!edit.macroError);

  return (
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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '24px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
            Edit All Participants - Current Week
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {enrollments.map((enrollment) => {
            const edit = edits[enrollment.id];
            const initialCalories = enrollment.bodyweight_kg 
              ? Math.round(enrollment.bodyweight_kg * 2.2 * challengeMultiplier)
              : 0;

            return (
              <div
                key={enrollment.id}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                  {getUserName(enrollment.user)}
                </h3>

                {/* Calories Section */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Initial Calories
                      </label>
                      <div
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '13px',
                        }}
                      >
                        {initialCalories}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Adjustment
                      </label>
                      <input
                        type="number"
                        value={edit.adjustment}
                        onChange={(e) => handleAdjustmentChange(enrollment.id, Number(e.target.value) || 0, initialCalories)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Total Calories
                      </label>
                      <input
                        type="number"
                        value={edit.totalCalories}
                        onChange={(e) => handleTotalChange(enrollment.id, Number(e.target.value) || 0, initialCalories)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Macros Section */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Macro Split (%)
                  </label>
                  {edit.macroError && (
                    <div style={{ marginBottom: '8px', padding: '6px 10px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '6px', color: '#FF3B30', fontSize: '12px' }}>
                      {edit.macroError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Protein %
                      </label>
                      <input
                        type="number"
                        value={edit.proteinPercent}
                        onChange={(e) => {
                          const newProtein = Number(e.target.value) || 0;
                          setEdits({
                            ...edits,
                            [enrollment.id]: {
                              ...edit,
                              proteinPercent: newProtein,
                            },
                          });
                        }}
                        min="0"
                        max="100"
                        step="0.1"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Carbs %
                      </label>
                      <input
                        type="number"
                        value={edit.carbsPercent}
                        onChange={(e) => {
                          const newCarbs = Number(e.target.value) || 0;
                          setEdits({
                            ...edits,
                            [enrollment.id]: {
                              ...edit,
                              carbsPercent: newCarbs,
                            },
                          });
                        }}
                        min="0"
                        max="100"
                        step="0.1"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Fat %
                      </label>
                      <input
                        type="number"
                        value={edit.fatPercent}
                        onChange={(e) => {
                          const newFat = Number(e.target.value) || 0;
                          setEdits({
                            ...edits,
                            [enrollment.id]: {
                              ...edit,
                              fatPercent: newFat,
                            },
                          });
                        }}
                        min="0"
                        max="100"
                        step="0.1"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total: {(edit.proteinPercent + edit.carbsPercent + edit.fatPercent).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            style={{
              padding: '10px 20px',
              background: hasErrors ? 'rgba(255, 59, 48, 0.2)' : '#007AFF',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving || hasErrors ? 'not-allowed' : 'pointer',
              opacity: saving || hasErrors ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>
    </div>
  );
}
