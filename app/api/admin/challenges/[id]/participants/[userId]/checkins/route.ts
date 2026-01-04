import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get enrollment for this user and challenge
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('challenge_enrollments')
      .select('*')
      .eq('challenge_id', params.id)
      .eq('user_id', params.userId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Fetch all daily check-ins for this enrollment
    const { data: checkins, error: checkinsError } = await supabase
      .from('challenge_daily_checkins')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('Error fetching daily check-ins:', checkinsError);
      return NextResponse.json(
        { error: 'Failed to fetch daily check-ins' },
        { status: 500 }
      );
    }

    // Fetch red days for this enrollment
    const { data: redDays, error: redDaysError } = await supabase
      .from('challenge_red_days')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('start_date', { ascending: true });

    if (redDaysError) {
      console.error('Error fetching red days:', redDaysError);
    }

    // Fetch weight measurements for this enrollment
    const { data: weightCheckins, error: weightError } = await supabase
      .from('challenge_weight_measurement_checkins')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('check_in_number', { ascending: true });

    if (weightError) {
      console.error('Error fetching weight check-ins:', weightError);
    }

    // Fetch physique check-ins for this enrollment
    const { data: physiqueCheckins, error: physiqueError } = await supabase
      .from('challenge_physique_checkins')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('check_in_number', { ascending: true });

    if (physiqueError) {
      console.error('Error fetching physique check-ins:', physiqueError);
    }

    // Fetch weekly check-ins for this enrollment
    const { data: weeklyCheckins, error: weeklyError } = await supabase
      .from('challenge_weekly_checkins')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('week_number', { ascending: true });

    if (weeklyError) {
      console.error('Error fetching weekly check-ins:', weeklyError);
    }

    return NextResponse.json({
      enrollment,
      checkins: checkins || [],
      redDays: redDays || [],
      weightCheckins: weightCheckins || [],
      physiqueCheckins: physiqueCheckins || [],
      weeklyCheckins: weeklyCheckins || [],
    });
  } catch (error) {
    console.error('Error fetching participant check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant check-ins' },
      { status: 500 }
    );
  }
}


