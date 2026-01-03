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
    const status = searchParams.get('status'); // pending, onboarded

    console.log('Fetching enrollments for challenge_id:', params.id);
    console.log('Status filter:', status);

    // First, try to get enrollments without the join to see if basic query works
    const { data: enrollmentsBasic, error: basicError } = await supabase
      .from('challenge_enrollments')
      .select('*')
      .eq('challenge_id', params.id);

    console.log('Basic query result:', {
      count: enrollmentsBasic?.length || 0,
      error: basicError?.message,
    });

    if (basicError) {
      console.error('Error in basic query:', basicError);
      throw basicError;
    }

    // Now try with the join - try both syntaxes
    // First try with explicit foreign key syntax
    let query = supabase
      .from('challenge_enrollments')
      .select(`
        *,
        profiles!user_id(id, first_name, last_name, nickname, avatar_url)
      `)
      .eq('challenge_id', params.id)
      .order('enrolled_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    let { data: enrollments, error } = await query;

    console.log('Join query result (profiles!user_id):', {
      count: enrollments?.length || 0,
      error: error?.message,
      code: error?.code,
      details: error?.details,
    });

    // If that fails, try the named relationship syntax
    if (error && enrollmentsBasic && enrollmentsBasic.length > 0) {
      console.log('Trying alternative join syntax: user:profiles');
      query = supabase
        .from('challenge_enrollments')
        .select(`
          *,
          user:profiles(id, first_name, last_name, nickname, avatar_url)
        `)
        .eq('challenge_id', params.id)
        .order('enrolled_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const result = await query;
      enrollments = result.data;
      error = result.error;

      console.log('Join query result (user:profiles):', {
        count: enrollments?.length || 0,
        error: error?.message,
        code: error?.code,
        details: error?.details,
      });
    }

    if (error) {
      console.error('Error fetching enrollments with join:', error);
      // If join fails, manually fetch profiles
      if (enrollmentsBasic && enrollmentsBasic.length > 0) {
        console.warn('Join failed, manually fetching profiles');
        const userIds = [...new Set(enrollmentsBasic.map((e: any) => e.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, nickname, avatar_url')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          }

          const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));
          
          return NextResponse.json({ 
            enrollments: enrollmentsBasic.map((e: any) => ({
              ...e,
              user: profilesMap.get(e.user_id) || null,
            }))
          });
        }
      }
      throw error;
    }

    // If join returns empty but basic query has data, manually fetch profiles
    if ((!enrollments || enrollments.length === 0) && enrollmentsBasic && enrollmentsBasic.length > 0) {
      console.warn('Join returned empty but basic query has data. Manually fetching profiles.');
      const userIds = [...new Set(enrollmentsBasic.map((e: any) => e.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, nickname, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        
        return NextResponse.json({ 
          enrollments: enrollmentsBasic.map((e: any) => ({
            ...e,
            user: profilesMap.get(e.user_id) || null,
          }))
        });
      }
    }

    // Transform the data structure if using profiles!user_id syntax
    const transformedEnrollments = (enrollments || []).map((e: any) => {
      if (e.profiles && !e.user) {
        // If data came from profiles!user_id, rename it to user
        return {
          ...e,
          user: e.profiles,
          profiles: undefined,
        };
      }
      return e;
    });

    return NextResponse.json({ enrollments: transformedEnrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const {
      user_id,
      bodyweight_kg,
      height_cm,
      calorie_adjustment,
      goal_id,
      fitness_level,
      short_term_goals,
      long_term_goals,
      events_during_challenge,
      competing_in_events,
    } = body;

    if (!user_id || !bodyweight_kg || !fitness_level) {
      return NextResponse.json(
        { error: 'user_id, bodyweight_kg, and fitness_level are required' },
        { status: 400 }
      );
    }

    // Fetch challenge to get defaults
    const { data: challenge } = await supabase
      .from('challenges')
      .select('calorie_multiplier, default_protein_percent, default_carbs_percent, default_fat_percent, default_min_steps')
      .eq('id', params.id)
      .single();

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const multiplier = challenge.calorie_multiplier || 15;
    const calculatedCalories = Math.round(bodyweight_kg * 2.2 * multiplier + (calorie_adjustment || 0));

    const insertData: any = {
      challenge_id: params.id,
      user_id,
      bodyweight_kg: Number(bodyweight_kg),
      height_cm: height_cm ? Number(height_cm) : null,
      calorie_adjustment: calorie_adjustment || 0,
      goal_id: goal_id || null,
      calculated_calories: calculatedCalories,
      protein_percent: challenge.default_protein_percent,
      carbs_percent: challenge.default_carbs_percent,
      fat_percent: challenge.default_fat_percent,
      min_steps: challenge.default_min_steps,
      fitness_level,
      short_term_goals: short_term_goals?.trim() || null,
      long_term_goals: long_term_goals?.trim() || null,
      events_during_challenge: events_during_challenge?.trim() || null,
      competing_in_events: competing_in_events || false,
      status: 'pending',
    };

    const { data: enrollment, error } = await supabase
      .from('challenge_enrollments')
      .insert(insertData)
      .select(`
        *,
        user:profiles(id, first_name, last_name, nickname, avatar_url)
      `)
      .single();

    if (error || !enrollment) {
      console.error('Error creating enrollment:', error);
      return NextResponse.json(
        {
          error: 'Failed to create enrollment',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}

