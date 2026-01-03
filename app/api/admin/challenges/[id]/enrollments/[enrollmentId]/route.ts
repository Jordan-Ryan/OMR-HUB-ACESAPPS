import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: enrollment, error } = await supabase
      .from('challenge_enrollments')
      .select(`
        *,
        user:profiles(id, first_name, last_name, nickname, avatar_url),
        goal:challenge_goals(*)
      `)
      .eq('id', params.enrollmentId)
      .eq('challenge_id', params.id)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    // Fetch current enrollment
    const { data: currentEnrollment } = await supabase
      .from('challenge_enrollments')
      .select('*')
      .eq('id', params.enrollmentId)
      .single();

    if (!currentEnrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Fetch challenge for multiplier
    const { data: challenge } = await supabase
      .from('challenges')
      .select('calorie_multiplier')
      .eq('id', params.id)
      .single();

    const multiplier = challenge?.calorie_multiplier || 15;

    const updateData: any = {};

    if (body.bodyweight_kg !== undefined) updateData.bodyweight_kg = Number(body.bodyweight_kg);
    if (body.height_cm !== undefined) updateData.height_cm = body.height_cm ? Number(body.height_cm) : null;
    if (body.calorie_adjustment !== undefined) updateData.calorie_adjustment = Number(body.calorie_adjustment);
    if (body.protein_percent !== undefined) updateData.protein_percent = body.protein_percent ? Number(body.protein_percent) : null;
    if (body.carbs_percent !== undefined) updateData.carbs_percent = body.carbs_percent ? Number(body.carbs_percent) : null;
    if (body.fat_percent !== undefined) updateData.fat_percent = body.fat_percent ? Number(body.fat_percent) : null;
    if (body.min_steps !== undefined) updateData.min_steps = body.min_steps ? Number(body.min_steps) : null;
    if (body.fitness_level !== undefined) updateData.fitness_level = body.fitness_level;
    if (body.short_term_goals !== undefined) updateData.short_term_goals = body.short_term_goals?.trim() || null;
    if (body.long_term_goals !== undefined) updateData.long_term_goals = body.long_term_goals?.trim() || null;
    if (body.events_during_challenge !== undefined) updateData.events_during_challenge = body.events_during_challenge?.trim() || null;
    if (body.competing_in_events !== undefined) updateData.competing_in_events = body.competing_in_events;
    if (body.goal_id !== undefined) updateData.goal_id = body.goal_id || null;
    if (body.use_goal_macro_split !== undefined) updateData.use_goal_macro_split = body.use_goal_macro_split;

    // Recalculate calories if bodyweight or adjustment changed
    if (body.bodyweight_kg !== undefined || body.calorie_adjustment !== undefined) {
      const bodyweight = body.bodyweight_kg !== undefined ? Number(body.bodyweight_kg) : currentEnrollment.bodyweight_kg;
      const adjustment = body.calorie_adjustment !== undefined ? Number(body.calorie_adjustment) : currentEnrollment.calorie_adjustment;
      updateData.calculated_calories = Math.round(bodyweight * 2.2 * multiplier + (adjustment || 0));
    }

    const { data: updatedEnrollment, error } = await supabase
      .from('challenge_enrollments')
      .update(updateData)
      .eq('id', params.enrollmentId)
      .select(`
        *,
        user:profiles(id, first_name, last_name, nickname, avatar_url),
        goal:challenge_goals(*)
      `)
      .single();

    if (error || !updatedEnrollment) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json(
        {
          error: 'Failed to update enrollment',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment: updatedEnrollment });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_enrollments')
      .delete()
      .eq('id', params.enrollmentId)
      .eq('challenge_id', params.id);

    if (error) {
      console.error('Error deleting enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to delete enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}

