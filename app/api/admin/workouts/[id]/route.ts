import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: workout, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises:workout_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, visibility, is_template, exercises } = body;

    // Update workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .update({
        name,
        description: description || null,
        visibility: visibility || 'private',
        is_template: is_template || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (workoutError || !workout) {
      return NextResponse.json(
        { error: 'Failed to update workout' },
        { status: 500 }
      );
    }

    // Delete existing exercises
    await supabase.from('workout_exercises').delete().eq('workout_id', params.id);

    // Add new exercises if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex: any, index: number) => ({
        workout_id: params.id,
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
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

