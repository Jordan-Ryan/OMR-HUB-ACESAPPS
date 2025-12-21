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

    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
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

    const {
      title,
      description,
      exercise_group_id,
      gender,
      video_url_male,
      video_url_female,
      thumbnail_url,
      muscle_groups,
      equipment_needed,
      difficulty_level,
      exercise_type,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .update({
        title,
        description: description || null,
        exercise_group_id: exercise_group_id || null,
        gender: gender || 'both',
        video_url_male: video_url_male || null,
        video_url_female: video_url_female || null,
        thumbnail_url: thumbnail_url || null,
        muscle_groups: muscle_groups || null,
        equipment_needed: equipment_needed || null,
        difficulty_level: difficulty_level || null,
        exercise_type: exercise_type || 'strength',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json(
        { error: 'Failed to update exercise' },
        { status: 500 }
      );
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}



