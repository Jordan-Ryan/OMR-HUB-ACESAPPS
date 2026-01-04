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

    // Fetch all daily check-ins for all enrollments
    const { data: checkins, error: checkinsError } = await supabase
      .from('challenge_daily_checkins')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('Error fetching daily check-ins:', checkinsError);
      return NextResponse.json(
        { error: 'Failed to fetch daily check-ins' },
        { status: 500 }
      );
    }

    // Fetch all red days for all enrollments
    const { data: redDays, error: redDaysError } = await supabase
      .from('challenge_red_days')
      .select('*')
      .in('enrollment_id', enrollmentIds)
      .order('start_date', { ascending: true });

    if (redDaysError) {
      console.error('Error fetching red days:', redDaysError);
      // Don't fail, just log the error
    }

    // Fetch latest weight for each enrollment
    const { data: weightCheckins, error: weightError } = await supabase
      .from('challenge_weight_measurement_checkins')
      .select('enrollment_id, weight_kg, check_in_number, submitted_at')
      .in('enrollment_id', enrollmentIds)
      .order('check_in_number', { ascending: false });

    if (weightError) {
      console.error('Error fetching weight check-ins:', weightError);
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

    // Get latest weight per enrollment
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

    return NextResponse.json({
      checkins: checkinsByEnrollment,
      redDays: redDaysByEnrollment,
      latestWeights,
    });
  } catch (error) {
    console.error('Error fetching participant check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant check-ins' },
      { status: 500 }
    );
  }
}


