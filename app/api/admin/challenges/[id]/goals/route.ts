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

    const { data: goals, error } = await supabase
      .from('challenge_goals')
      .select('*')
      .eq('challenge_id', params.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
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
      goal_name,
      calorie_adjustment,
      display_order,
      protein_percent,
      carbs_percent,
      fat_percent,
    } = body;

    if (!goal_name || calorie_adjustment === undefined) {
      return NextResponse.json(
        { error: 'goal_name and calorie_adjustment are required' },
        { status: 400 }
      );
    }

    // Validate macro percentages if provided
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

    const insertData: any = {
      challenge_id: params.id,
      goal_name: goal_name.trim(),
      calorie_adjustment: Number(calorie_adjustment),
      display_order: display_order !== undefined ? Number(display_order) : 0,
      protein_percent: protein_percent !== undefined ? (protein_percent ? Number(protein_percent) : null) : null,
      carbs_percent: carbs_percent !== undefined ? (carbs_percent ? Number(carbs_percent) : null) : null,
      fat_percent: fat_percent !== undefined ? (fat_percent ? Number(fat_percent) : null) : null,
    };

    const { data: goal, error } = await supabase
      .from('challenge_goals')
      .insert(insertData)
      .select()
      .single();

    if (error || !goal) {
      console.error('Error creating goal:', error);
      return NextResponse.json(
        {
          error: 'Failed to create goal',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

