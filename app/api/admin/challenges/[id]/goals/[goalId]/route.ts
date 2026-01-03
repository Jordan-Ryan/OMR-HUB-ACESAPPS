import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; goalId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const {
      goal_name,
      calorie_adjustment,
      display_order,
      protein_percent,
      carbs_percent,
      fat_percent,
    } = body;

    // Validate macro percentages if all provided
    if (protein_percent !== null && protein_percent !== undefined &&
        carbs_percent !== null && carbs_percent !== undefined &&
        fat_percent !== null && fat_percent !== undefined) {
      const sum = Number(protein_percent) + Number(carbs_percent) + Number(fat_percent);
      if (Math.abs(sum - 100) > 0.01) {
        return NextResponse.json(
          { error: 'Macro percentages must sum to 100' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (goal_name !== undefined) updateData.goal_name = goal_name.trim();
    if (calorie_adjustment !== undefined) updateData.calorie_adjustment = Number(calorie_adjustment);
    if (display_order !== undefined) updateData.display_order = Number(display_order);
    if (protein_percent !== undefined) updateData.protein_percent = protein_percent ? Number(protein_percent) : null;
    if (carbs_percent !== undefined) updateData.carbs_percent = carbs_percent ? Number(carbs_percent) : null;
    if (fat_percent !== undefined) updateData.fat_percent = fat_percent ? Number(fat_percent) : null;

    const { data: updatedGoal, error } = await supabase
      .from('challenge_goals')
      .update(updateData)
      .eq('id', params.goalId)
      .eq('challenge_id', params.id)
      .select()
      .single();

    if (error || !updatedGoal) {
      console.error('Error updating goal:', error);
      return NextResponse.json(
        {
          error: 'Failed to update goal',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; goalId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_goals')
      .delete()
      .eq('id', params.goalId)
      .eq('challenge_id', params.id);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json(
        { error: 'Failed to delete goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

