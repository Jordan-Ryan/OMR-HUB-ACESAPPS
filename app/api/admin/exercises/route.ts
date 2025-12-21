import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ exercises: exercises || [] });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
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
      is_custom,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .insert({
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
        is_custom: is_custom || false,
        created_by_user_id: admin.id,
      })
      .select()
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json(
        { error: 'Failed to create exercise' },
        { status: 500 }
      );
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}



