import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises:workout_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ workouts: workouts || [] });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, visibility, is_template, exercises } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: admin.id,
        name,
        description: description || null,
        visibility: visibility || 'private',
        is_template: is_template || false,
      })
      .select()
      .single();

    if (workoutError || !workout) {
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      );
    }

    // Add exercises if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex: any, index: number) => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index !== undefined ? ex.order_index : index,
        sets: ex.sets || null,
        reps: ex.reps || null,
        weight: ex.weight || null,
        rest_seconds: ex.rest_seconds || null,
        notes: ex.notes || null,
        reps_min: ex.reps_min || null,
        reps_max: ex.reps_max || null,
        reps_target: ex.reps_target || null,
        is_amrap: ex.is_amrap || false,
        weight_percentage: ex.weight_percentage || null,
        rpe_target: ex.rpe_target || null,
        tempo: ex.tempo || null,
        distance_km: ex.distance_km || null,
        time_minutes: ex.time_minutes || null,
        time_seconds: ex.time_seconds || null,
      }));

      await supabase.from('workout_exercises').insert(exercisesToInsert);
    }

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}



