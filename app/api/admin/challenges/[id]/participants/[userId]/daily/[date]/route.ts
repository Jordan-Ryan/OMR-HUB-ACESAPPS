import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; userId: string; date: string } }
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

    // Fetch check-in for specific date
    const { data: checkin, error: checkinError } = await supabase
      .from('challenge_daily_checkins')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .eq('date', params.date)
      .single();

    if (checkinError && checkinError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is OK
      console.error('Error fetching daily check-in:', checkinError);
      return NextResponse.json(
        { error: 'Failed to fetch daily check-in' },
        { status: 500 }
      );
    }

    // Check if this date is a red day
    const { data: redDays, error: redDaysError } = await supabase
      .from('challenge_red_days')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .lte('start_date', params.date)
      .gte('end_date', params.date);

    if (redDaysError) {
      console.error('Error fetching red days:', redDaysError);
    }

    const isRedDay = redDays && redDays.length > 0;

    return NextResponse.json({
      checkin: checkin || null,
      enrollment,
      isRedDay: isRedDay || false,
      redDay: redDays && redDays.length > 0 ? redDays[0] : null,
    });
  } catch (error) {
    console.error('Error fetching day detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day detail' },
      { status: 500 }
    );
  }
}



