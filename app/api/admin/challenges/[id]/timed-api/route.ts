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

    const { data: challenges, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('challenge_id', params.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching community challenges:', error);
      throw error;
    }

    // Get submission counts for each challenge
    const challengeIds = challenges?.map((c: any) => c.id) || [];
    let challengesWithCounts = challenges || [];

    if (challengeIds.length > 0) {
      const { data: submissions } = await supabase
        .from('community_challenge_submissions')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      const submissionCounts = new Map<string, number>();
      submissions?.forEach((submission: any) => {
        const current = submissionCounts.get(submission.challenge_id) || 0;
        submissionCounts.set(submission.challenge_id, current + 1);
      });

      challengesWithCounts = challenges.map((challenge: any) => ({
        ...challenge,
        submission_count: submissionCounts.get(challenge.id) || 0,
      }));
    }

    return NextResponse.json({ challenges: challengesWithCounts });
  } catch (error) {
    console.error('Error fetching community challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community challenges' },
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
      title,
      description,
      challenge_type,
      start_date,
      end_date,
      linked_challenge_id,
    } = body;

    if (!title || !challenge_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Title, challenge_type, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be on or after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping challenges
    const { data: existingChallenges } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('challenge_id', params.id);

    const overlapping = existingChallenges?.find((c: any) => {
      const cStart = new Date(c.start_date);
      const cEnd = new Date(c.end_date);
      return (startDate <= cEnd && endDate >= cStart);
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'A community challenge already exists during this date range' },
        { status: 400 }
      );
    }

    const insertData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      challenge_type,
      start_date,
      end_date,
      challenge_id: params.id,
      linked_challenge_id: linked_challenge_id || null,
      created_by: admin.id,
    };

    const { data: challenge, error } = await supabase
      .from('community_challenges')
      .insert(insertData)
      .select()
      .single();

    if (error || !challenge) {
      console.error('Error creating community challenge:', error);
      return NextResponse.json(
        {
          error: 'Failed to create community challenge',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error creating community challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create community challenge' },
      { status: 500 }
    );
  }
}

