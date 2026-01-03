import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // upcoming, active, past

    // Query long-term challenges only
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('is_long_term_challenge', true)
      .order('start_at', { ascending: false });

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }

    // Filter by status if provided
    let filteredChallenges = challenges || [];
    if (status) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredChallenges = filteredChallenges.filter((challenge: any) => {
        const startDate = new Date(challenge.start_at);
        const endDate = new Date(challenge.end_at);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (status === 'upcoming') {
          return startDate > today;
        } else if (status === 'active') {
          return startDate <= today && endDate >= today;
        } else if (status === 'past') {
          return endDate < today;
        }
        return true;
      });
    }

    // Get enrollment counts for each challenge
    const challengeIds = filteredChallenges.map((c: any) => c.id);
    let challengesWithCounts = filteredChallenges;

    if (challengeIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('challenge_enrollments')
        .select('challenge_id, status')
        .in('challenge_id', challengeIds);

      const enrollmentCounts = new Map<string, { total: number; onboarded: number; pending: number }>();
      
      enrollments?.forEach((enrollment: any) => {
        const current = enrollmentCounts.get(enrollment.challenge_id) || { total: 0, onboarded: 0, pending: 0 };
        current.total++;
        if (enrollment.status === 'onboarded') {
          current.onboarded++;
        } else {
          current.pending++;
        }
        enrollmentCounts.set(enrollment.challenge_id, current);
      });

      challengesWithCounts = filteredChallenges.map((challenge: any) => {
        const counts = enrollmentCounts.get(challenge.id) || { total: 0, onboarded: 0, pending: 0 };
        return {
          ...challenge,
          enrollment_count: counts.total,
          onboarded_count: counts.onboarded,
          pending_count: counts.pending,
        };
      });
    }

    return NextResponse.json({ challenges: challengesWithCounts });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
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

    if (!title || !start_at || !end_at) {
      return NextResponse.json(
        { error: 'Title, start_at, and end_at are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be on or after start date' },
        { status: 400 }
      );
    }

    // Validate macro percentages sum to 100 if all provided
    if (
      default_protein_percent !== null &&
      default_carbs_percent !== null &&
      default_fat_percent !== null
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

    const insertData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      start_at,
      end_at,
      image_url: image_url?.trim() || null,
      default_min_steps: default_min_steps ? Number(default_min_steps) : null,
      calorie_multiplier: calorie_multiplier ? Number(calorie_multiplier) : 15,
      default_protein_percent: default_protein_percent ? Number(default_protein_percent) : null,
      default_carbs_percent: default_carbs_percent ? Number(default_carbs_percent) : null,
      default_fat_percent: default_fat_percent ? Number(default_fat_percent) : null,
      weight_measurement_frequency: weight_measurement_frequency || null,
      physique_frequency: physique_frequency || null,
      allow_client_weight_checkin: allow_client_weight_checkin ?? true,
      allow_client_physique_checkin: allow_client_physique_checkin ?? true,
      coach_id: coach_id || null,
      challenge_info: challenge_info?.trim() || null,
      approve_button_text: approve_button_text?.trim() || null,
      decline_button_text: decline_button_text?.trim() || null,
      is_long_term_challenge: true,
      created_by: admin.id,
    };

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert(insertData)
      .select()
      .single();

    if (challengeError || !challenge) {
      console.error('Error creating challenge:', challengeError);
      return NextResponse.json(
        {
          error: 'Failed to create challenge',
          details: challengeError?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}

