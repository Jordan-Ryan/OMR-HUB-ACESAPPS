import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get all enrollments for this challenge
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('challenge_enrollments')
      .select('id, user_id')
      .eq('challenge_id', params.id);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        checkins: {},
        redDays: {},
        latestWeights: {},
      });
    }

    const enrollmentIds = enrollments.map(e => e.id);

    // Fetch all daily check-ins for all enrollments using pagination
    const PAGE_SIZE = 1000;
    let allCheckins: any[] = [];
    let from = 0;
    let to = PAGE_SIZE - 1;
    let hasMore = true;

    while (hasMore) {
      const { data: checkins, error: checkinsError } = await supabase
        .from('challenge_daily_checkins')
        .select('*')
        .in('enrollment_id', enrollmentIds)
        .order('date', { ascending: true })
        .range(from, to);

      if (checkinsError) {
        console.error('Error fetching daily check-ins:', checkinsError);
        return NextResponse.json(
          { error: 'Failed to fetch daily check-ins' },
          { status: 500 }
        );
      }

      if (checkins && checkins.length > 0) {
        allCheckins = allCheckins.concat(checkins);
        hasMore = checkins.length === PAGE_SIZE;
        from += PAGE_SIZE;
        to += PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    const checkins = allCheckins;

    // Fetch all red days for all enrollments
    const { data: redDays, error: redDaysError } = await supabase
      .from('challenge_red_days')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .order('start_date', { ascending: true })
      .limit(1000);

    if (redDaysError) {
      console.error('Error fetching red days:', redDaysError);
      // Don't fail, just log the error
    }

    // Fetch all weight check-ins (not just latest) for majority-of-week calculation
    const { data: weightCheckins, error: weightError } = await supabase
      .from('challenge_weight_measurement_checkins')
      .select('enrollment_id, weight_kg, check_in_number, submitted_at')
      .in('enrollment_id', enrollmentIds)
      .order('submitted_at', { ascending: true });

    if (weightError) {
      console.error('Error fetching weight check-ins:', weightError);
      // Don't fail, just log the error
    }

    // Fetch all physique check-ins for photo detection
    const { data: physiqueCheckins, error: physiqueError } = await supabase
      .from('challenge_physique_checkins')
      .select('enrollment_id, check_in_number, front_photo_url, back_photo_url, side_photo_url, submitted_at')
      .in('enrollment_id', enrollmentIds)
      .order('submitted_at', { ascending: true });

    if (physiqueError) {
      console.error('Error fetching physique check-ins:', physiqueError);
      // Don't fail, just log the error
    }

    // Fetch enrollment history for all enrollments
    const { data: enrollmentHistory, error: historyError } = await supabase
      .from('challenge_enrollment_history')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .order('effective_date', { ascending: true });

    if (historyError) {
      console.error('Error fetching enrollment history:', historyError);
      // Don't fail, just log the error
    }

    // Organize check-ins by enrollment_id and date
    const checkinsByEnrollment: Record<string, Record<string, any>> = {};
    (checkins || []).forEach(checkin => {
      if (!checkinsByEnrollment[checkin.enrollment_id]) {
        checkinsByEnrollment[checkin.enrollment_id] = {};
      }
      checkinsByEnrollment[checkin.enrollment_id][checkin.date] = checkin;
    });

    // Organize red days by enrollment_id
    const redDaysByEnrollment: Record<string, Array<{ start_date: string; end_date: string }>> = {};
    (redDays || []).forEach(redDay => {
      if (!redDaysByEnrollment[redDay.enrollment_id]) {
        redDaysByEnrollment[redDay.enrollment_id] = [];
      }
      redDaysByEnrollment[redDay.enrollment_id].push({
        start_date: redDay.start_date,
        end_date: redDay.end_date,
      });
    });

    // Get latest weight per enrollment (for backward compatibility)
    const latestWeights: Record<string, { weight_kg: number | null; check_in_number: number | null }> = {};
    const weightMap = new Map<string, any>();
    (weightCheckins || []).forEach(weight => {
      if (!weightMap.has(weight.enrollment_id)) {
        weightMap.set(weight.enrollment_id, weight);
      }
    });
    weightMap.forEach((weight, enrollmentId) => {
      latestWeights[enrollmentId] = {
        weight_kg: weight.weight_kg,
        check_in_number: weight.check_in_number,
      };
    });

    // Organize enrollment history by enrollment_id
    const historyByEnrollment: Record<string, Array<any>> = {};
    (enrollmentHistory || []).forEach(history => {
      if (!historyByEnrollment[history.enrollment_id]) {
        historyByEnrollment[history.enrollment_id] = [];
      }
      historyByEnrollment[history.enrollment_id].push(history);
    });

    // Organize weight check-ins by enrollment_id
    const weightsByEnrollment: Record<string, Array<any>> = {};
    (weightCheckins || []).forEach(weight => {
      if (!weightsByEnrollment[weight.enrollment_id]) {
        weightsByEnrollment[weight.enrollment_id] = [];
      }
      weightsByEnrollment[weight.enrollment_id].push(weight);
    });

    // Organize physique check-ins by enrollment_id
    const physiqueByEnrollment: Record<string, Array<any>> = {};
    (physiqueCheckins || []).forEach(physique => {
      if (!physiqueByEnrollment[physique.enrollment_id]) {
        physiqueByEnrollment[physique.enrollment_id] = [];
      }
      physiqueByEnrollment[physique.enrollment_id].push(physique);
    });

    // Fetch weekly workout schedules for all enrollments
    const { data: weeklyWorkoutSchedules, error: schedulesError } = await supabase
      .from('challenge_weekly_workout_schedules')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .order('scheduled_date', { ascending: true });

    if (schedulesError) {
      console.error('Error fetching weekly workout schedules:', schedulesError);
      // Don't fail, just log the error
    }

    // Organize weekly workout schedules by enrollment_id
    const schedulesByEnrollment: Record<string, Array<any>> = {};
    (weeklyWorkoutSchedules || []).forEach(schedule => {
      if (!schedulesByEnrollment[schedule.enrollment_id]) {
        schedulesByEnrollment[schedule.enrollment_id] = [];
      }
      schedulesByEnrollment[schedule.enrollment_id].push(schedule);
    });

    return NextResponse.json({
      checkins: checkinsByEnrollment,
      redDays: redDaysByEnrollment,
      latestWeights,
      enrollmentHistory: historyByEnrollment,
      weightCheckins: weightsByEnrollment,
      physiqueCheckins: physiqueByEnrollment,
      weeklyWorkoutSchedules: schedulesByEnrollment,
    });
  } catch (error) {
    console.error('Error fetching participant check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant check-ins' },
      { status: 500 }
    );
  }
}


