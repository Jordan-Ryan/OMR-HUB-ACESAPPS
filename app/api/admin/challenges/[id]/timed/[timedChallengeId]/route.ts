import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; timedChallengeId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Fetch the community challenge by ID (it may or may not be linked to this challenge)
    const { data: challenge, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('id', params.timedChallengeId)
      .single();

    if (error || !challenge) {
      return NextResponse.json(
        { error: 'Timed challenge not found' },
        { status: 404 }
      );
    }

    // Get submission count
    const { count: submissionCount } = await supabase
      .from('community_challenge_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.timedChallengeId);

    return NextResponse.json({
      challenge: {
        ...challenge,
        submission_count: submissionCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching timed challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timed challenge' },
      { status: 500 }
    );
  }
}

