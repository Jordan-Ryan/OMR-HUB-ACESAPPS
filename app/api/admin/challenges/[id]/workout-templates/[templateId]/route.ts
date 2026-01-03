import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
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

    const updateData: any = {};

    if (fitness_level !== undefined) updateData.fitness_level = fitness_level;
    if (week_number !== undefined) updateData.week_number = week_number ? Number(week_number) : null;
    if (weights_circuits_count !== undefined) updateData.weights_circuits_count = Number(weights_circuits_count);
    if (run_sessions !== undefined) updateData.run_sessions = run_sessions || null;

    const { data: updatedTemplate, error } = await supabase
      .from('challenge_workout_templates')
      .update(updateData)
      .eq('id', params.templateId)
      .eq('challenge_id', params.id)
      .select()
      .single();

    if (error || !updatedTemplate) {
      console.error('Error updating workout template:', error);
      return NextResponse.json(
        {
          error: 'Failed to update workout template',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Error updating workout template:', error);
    return NextResponse.json(
      { error: 'Failed to update workout template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_workout_templates')
      .delete()
      .eq('id', params.templateId)
      .eq('challenge_id', params.id);

    if (error) {
      console.error('Error deleting workout template:', error);
      return NextResponse.json(
        { error: 'Failed to delete workout template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout template:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout template' },
      { status: 500 }
    );
  }
}

