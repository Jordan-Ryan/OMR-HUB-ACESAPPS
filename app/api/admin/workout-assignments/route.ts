import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { workout_id, assigned_to_user_id, notes } = body;

    if (!workout_id || !assigned_to_user_id) {
      return NextResponse.json(
        { error: 'workout_id and assigned_to_user_id are required' },
        { status: 400 }
      );
    }

    // Get the workout to create an assigned copy
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workout_id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Create a copy of the workout for the assigned user
    const { data: assignedWorkout, error: createError } = await supabase
      .from('workouts')
      .insert({
        user_id: assigned_to_user_id,
        name: workout.name,
        description: workout.description,
        is_template: false,
        visibility: 'private',
      })
      .select()
      .single();

    if (createError || !assignedWorkout) {
      return NextResponse.json(
        { error: 'Failed to create assigned workout' },
        { status: 500 }
      );
    }

    // Copy workout exercises
    const { data: exercises } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workout_id)
      .order('order_index');

    if (exercises && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex) => ({
        workout_id: assignedWorkout.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        reps_target: ex.reps_target,
        is_amrap: ex.is_amrap,
        weight_percentage: ex.weight_percentage,
        rpe_target: ex.rpe_target,
        tempo: ex.tempo,
        distance_km: ex.distance_km,
        time_minutes: ex.time_minutes,
        time_seconds: ex.time_seconds,
      }));

      await supabase.from('workout_exercises').insert(exercisesToInsert);
    }

    // Create assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('workout_assignments')
      .insert({
        workout_id: workout_id,
        assigned_to_user_id: assigned_to_user_id,
        assigned_by_user_id: admin.id,
        assigned_workout_id: assignedWorkout.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (assignmentError) {
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment, assigned_workout: assignedWorkout });
  } catch (error) {
    console.error('Error assigning workout:', error);
    return NextResponse.json(
      { error: 'Failed to assign workout' },
      { status: 500 }
    );
  }
}

