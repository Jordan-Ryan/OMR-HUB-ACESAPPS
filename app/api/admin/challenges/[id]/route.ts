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

    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', params.id)
      .eq('is_long_term_challenge', true)
      .single();

    if (error || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Get enrollment count
    const { count: enrollmentCount } = await supabase
      .from('challenge_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.id);

    // Get goals count
    const { count: goalsCount } = await supabase
      .from('challenge_goals')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.id);

    // Get community challenges count
    const { count: communityChallengesCount } = await supabase
      .from('community_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.id);

    return NextResponse.json({
      challenge: {
        ...challenge,
        enrollment_count: enrollmentCount || 0,
        goals_count: goalsCount || 0,
        community_challenges_count: communityChallengesCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
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
      start_at,
      end_at,
      image_url,
      default_min_steps,
      calorie_multiplier,
      default_protein_percent,
      default_carbs_percent,
      default_fat_percent,
      weight_measurement_frequency,
      physique_frequency,
      allow_client_weight_checkin,
      allow_client_physique_checkin,
      coach_id,
      challenge_info,
      approve_button_text,
      decline_button_text,
    } = body;

    // Validate dates if provided
    if (start_at && end_at) {
      const startDate = new Date(start_at);
      const endDate = new Date(end_at);
      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be on or after start date' },
          { status: 400 }
        );
      }
    }

    // Validate macro percentages if all provided
    if (
      default_protein_percent !== null &&
      default_protein_percent !== undefined &&
      default_carbs_percent !== null &&
      default_carbs_percent !== undefined &&
      default_fat_percent !== null &&
      default_fat_percent !== undefined
    ) {
      const sum =
        Number(default_protein_percent) +
        Number(default_carbs_percent) +
        Number(default_fat_percent);
      if (Math.abs(sum - 100) > 0.01) {
        return NextResponse.json(
          { error: 'Macro percentages must sum to 100' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (end_at !== undefined) updateData.end_at = end_at;
    if (image_url !== undefined) updateData.image_url = image_url?.trim() || null;
    if (default_min_steps !== undefined) updateData.default_min_steps = default_min_steps ? Number(default_min_steps) : null;
    if (calorie_multiplier !== undefined) updateData.calorie_multiplier = calorie_multiplier ? Number(calorie_multiplier) : 15;
    if (default_protein_percent !== undefined) updateData.default_protein_percent = default_protein_percent ? Number(default_protein_percent) : null;
    if (default_carbs_percent !== undefined) updateData.default_carbs_percent = default_carbs_percent ? Number(default_carbs_percent) : null;
    if (default_fat_percent !== undefined) updateData.default_fat_percent = default_fat_percent ? Number(default_fat_percent) : null;
    if (weight_measurement_frequency !== undefined) updateData.weight_measurement_frequency = weight_measurement_frequency || null;
    if (physique_frequency !== undefined) updateData.physique_frequency = physique_frequency || null;
    if (allow_client_weight_checkin !== undefined) updateData.allow_client_weight_checkin = allow_client_weight_checkin;
    if (allow_client_physique_checkin !== undefined) updateData.allow_client_physique_checkin = allow_client_physique_checkin;
    if (coach_id !== undefined) updateData.coach_id = coach_id || null;
    if (challenge_info !== undefined) updateData.challenge_info = challenge_info?.trim() || null;
    if (approve_button_text !== undefined) updateData.approve_button_text = approve_button_text?.trim() || null;
    if (decline_button_text !== undefined) updateData.decline_button_text = decline_button_text?.trim() || null;

    const { data: updatedChallenge, error } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !updatedChallenge) {
      console.error('Error updating challenge:', error);
      return NextResponse.json(
        {
          error: 'Failed to update challenge',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge: updatedChallenge });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Check if challenge has enrollments
    const { count: enrollmentCount } = await supabase
      .from('challenge_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.id);

    if (enrollmentCount && enrollmentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete challenge with existing enrollments' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', params.id)
      .eq('is_long_term_challenge', true);

    if (error) {
      console.error('Error deleting challenge:', error);
      return NextResponse.json(
        { error: 'Failed to delete challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
}

