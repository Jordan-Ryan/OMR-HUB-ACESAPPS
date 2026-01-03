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

    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('week_number');
    const fitnessLevel = searchParams.get('fitness_level');

    let query = supabase
      .from('challenge_workout_templates')
      .select('*')
      .eq('challenge_id', params.id)
      .order('fitness_level', { ascending: true })
      .order('week_number', { ascending: true, nullsFirst: true });

    if (weekNumber) {
      query = query.or(`week_number.eq.${weekNumber},week_number.is.null`);
    }

    if (fitnessLevel) {
      query = query.eq('fitness_level', fitnessLevel);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching workout templates:', error);
      throw error;
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout templates' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const {
      fitness_level,
      week_number,
      weights_circuits_count,
      run_sessions,
    } = body;

    if (!fitness_level || weights_circuits_count === undefined) {
      return NextResponse.json(
        { error: 'fitness_level and weights_circuits_count are required' },
        { status: 400 }
      );
    }

    const insertData: any = {
      challenge_id: params.id,
      fitness_level,
      week_number: week_number !== undefined ? (week_number ? Number(week_number) : null) : null,
      weights_circuits_count: Number(weights_circuits_count),
      run_sessions: run_sessions || null,
    };

    const { data: template, error } = await supabase
      .from('challenge_workout_templates')
      .insert(insertData)
      .select()
      .single();

    if (error || !template) {
      console.error('Error creating workout template:', error);
      return NextResponse.json(
        {
          error: 'Failed to create workout template',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating workout template:', error);
    return NextResponse.json(
      { error: 'Failed to create workout template' },
      { status: 500 }
    );
  }
}

