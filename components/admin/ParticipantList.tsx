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

  useEffect(() => {
    fetchEnrollments();
  }, [challengeId]);

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

  const getStepsStatus = (checkin: DailyCheckin | undefined, stepGoal: number | null): 'green' | 'red' | 'none' => {
    if (!checkin || checkin.steps === null || stepGoal === null) return 'none';
    return checkin.steps >= stepGoal ? 'green' : 'red';
  };

  const getMacrosStatus = (checkin: DailyCheckin | undefined, enrollment: Enrollment, date: string): 'green' | 'amber' | 'red' | 'none' => {
    if (!checkin || checkin.protein_g === null || checkin.carbs_g === null || checkin.fat_g === null) return 'none';
    if (!enrollment.calculated_calories || enrollment.calculated_calories <= 0) return 'none';
    if (checkin.calories_consumed === null) return 'none';

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
    if (caloriesInRange && !allMacrosInRange) return 'amber';
    return 'red';
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
  const getScheduledWorkoutStatus = (enrollmentId: string, dateStr: string): 'grey' | 'red' | 'green' | 'orange' | null => {
    const schedules = weeklyWorkoutSchedulesData[enrollmentId] || [];
    const scheduledForDate = schedules.filter(s => s.scheduled_date === dateStr);
    
    if (scheduledForDate.length === 0) {
      // Check if there's an unplanned workout completed on this date
      const checkin = checkinsData[enrollmentId]?.[dateStr];
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

    const checkin = checkinsData[enrollmentId]?.[dateStr];
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
              minWidth: `${180 + 100 + 100 + 120 + (days.length * 60)}px`, // Participant + Weight + Calories + Macros + days
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
                      onClick={() => {
                        router.push(`/admin/challenges/${challengeId}/participants/${enrollment.user_id}`);
                      }}
                      style={{
                        padding: '10px 12px',
                        position: 'sticky',
                        left: 0,
                        background: '#1a1a1a',
                        zIndex: 9,
                        minWidth: '180px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#242424';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
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
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
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
                        minWidth: '100px',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {(() => {
                        const majorityCalories = getMajorityOfWeekCalories(enrollment);
                        return majorityCalories !== null ? (
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                            {majorityCalories}
                      </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.3)' }}>-</div>
                        );
                      })()}
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
                      {(() => {
                        const majorityMacros = getMajorityOfWeekMacros(enrollment);
                        return majorityMacros !== null ? (
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                            {majorityMacros.protein.toFixed(0)}/{majorityMacros.carbs.toFixed(0)}/{majorityMacros.fat.toFixed(0)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.3)' }}>-</div>
                        );
                      })()}
                    </td>
                    {/* Date Cells */}
                    {days.map((day) => {
                      const dateStr = formatDateString(day.date);
                      const checkin = getCheckinForDate(enrollment.id, dateStr);
                      const isRed = isRedDay(enrollment.id, dateStr);
                      const hasCheckin = !!checkin;
                      const isTodayDate = isToday(day.date);
                      
                      // Show icons for all days within the challenge date range
                      // The enrollment start date is only used to determine if check-ins are valid, not whether to show icons
                      const dayDate = new Date(dateStr);
                      dayDate.setHours(0, 0, 0, 0);
                      const challengeStart = new Date(challengeStartDate);
                      challengeStart.setHours(0, 0, 0, 0);
                      const challengeEnd = new Date(challengeEndDate);
                      challengeEnd.setHours(23, 59, 59, 999);
                      
                      // Show icons for all days in the challenge range
                      const shouldShowIcons = dayDate >= challengeStart && dayDate <= challengeEnd;
                      
                      const stepsStatus = shouldShowIcons ? getStepsStatus(checkin, enrollment.min_steps || null) : 'none';
                      const macrosStatus = shouldShowIcons ? getMacrosStatus(checkin, enrollment, dateStr) : 'none';
                      const workoutIcons = shouldShowIcons ? getWorkoutIcons(checkin) : { weights: false, cardio: false };
                      const scheduledWorkoutStatus = shouldShowIcons ? getScheduledWorkoutStatus(enrollment.id, dateStr) : null;
                      const scheduledWorkouts = shouldShowIcons ? getScheduledWorkoutsForDate(enrollment.id, dateStr) : [];
                      const physiqueStatus = shouldShowIcons ? getPhysiqueCheckinStatus(enrollment.id, dateStr, enrollment) : { show: false, isMissed: false };
                      const weightStatus = shouldShowIcons ? getWeightCheckinStatus(enrollment.id, dateStr, enrollment) : { show: false, isMissed: false };

                      // Determine cell background color - highlight today, red for red days or missed check-ins
                      let cellBgColor = 'transparent';
                      
                      // Check if check-in is missed (day is in past/today, within challenge range, after enrollment start, but no check-in)
                      const enrollmentStart = enrollment.start_date ? new Date(enrollment.start_date) : challengeStart;
                      enrollmentStart.setHours(0, 0, 0, 0);
                      const isMissedCheckin = !hasCheckin && 
                        dayDate >= enrollmentStart && 
                        dayDate <= challengeEnd && 
                        dayDate <= today;
                      
                      if (isTodayDate) {
                        cellBgColor = 'rgba(0, 122, 255, 0.1)';
                      } else if (isRed || isMissedCheckin) {
                        cellBgColor = 'rgba(255, 59, 48, 0.2)';
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
                                {/* Steps Icon - always show (grey if no data) */}
                                  <WalkIcon 
                                    width={16} 
                                    height={16} 
                                    style={{ 
                                      color: stepsStatus === 'green' 
                                        ? '#34C759' 
                                        : stepsStatus === 'red' 
                                        ? '#FF3B30' 
                                        : 'rgba(255, 255, 255, 0.3)' 
                                    }} 
                                  />
                                
                                {/* Macros Icon - always show (grey if no data) */}
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
                                    
                                    let statusColor = 'rgba(255, 255, 255, 0.3)';
                                    if (scheduledWorkoutStatus === 'green') {
                                      statusColor = '#34C759';
                                    } else if (scheduledWorkoutStatus === 'red') {
                                      statusColor = '#FF3B30';
                                    } else if (scheduledWorkoutStatus === 'grey') {
                                      statusColor = 'rgba(255, 255, 255, 0.3)';
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
                                  } else if (scheduledWorkoutStatus === 'orange') {
                                    // Unplanned workout completed
                                    return (
                                      <>
                                        {workoutIcons.weights && (
                                          <BarbellIcon width={16} height={16} style={{ color: '#FF9500' }} />
                                        )}
                                        {workoutIcons.cardio && (
                                          <FitnessIcon width={16} height={16} style={{ color: '#FF9500' }} />
                                        )}
                                        {!workoutIcons.weights && !workoutIcons.cardio && (
                                          <FitnessIcon width={16} height={16} style={{ color: '#FF9500' }} />
                                        )}
                                      </>
                                    );
                                  } else if (workoutIcons.weights || workoutIcons.cardio) {
                                    // Regular workout completed (no schedule)
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
    </div>
  );
}
