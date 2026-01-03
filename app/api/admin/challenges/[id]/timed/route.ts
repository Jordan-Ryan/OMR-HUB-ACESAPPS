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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date query parameters are required' },
        { status: 400 }
      );
    }

    // Fetch all community challenges that fall within the date range
    // A challenge overlaps if: challenge_start <= range_end AND challenge_end >= range_start
    // Normalize dates to just the date part (YYYY-MM-DD) for comparison
    const startDateOnly = startDate.split('T')[0];
    const endDateOnly = endDate.split('T')[0];
    
    // Fetch all community challenges first, then filter by date overlap
    const { data: allChallenges, error } = await supabase
      .from('community_challenges')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching timed challenges:', error);
      throw error;
    }

    // Filter to only include challenges that actually overlap with the date range
    const filteredChallenges = (allChallenges || []).filter((challenge: any) => {
      const challengeStart = new Date(challenge.start_date);
      const challengeEnd = new Date(challenge.end_date);
      const rangeStart = new Date(startDateOnly);
      const rangeEnd = new Date(endDateOnly);
      
      // Set time to start/end of day for proper comparison
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
      challengeStart.setHours(0, 0, 0, 0);
      challengeEnd.setHours(23, 59, 59, 999);
      
      // Check if challenge overlaps with the date range
      // Overlap occurs when: challengeStart <= rangeEnd AND challengeEnd >= rangeStart
      return challengeStart <= rangeEnd && challengeEnd >= rangeStart;
    });

    // Get submission counts for each challenge
    const challengeIds = filteredChallenges.map((c: any) => c.id);
    let challengesWithCounts = filteredChallenges;

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

      challengesWithCounts = filteredChallenges.map((challenge: any) => ({
        ...challenge,
        submission_count: submissionCounts.get(challenge.id) || 0,
      }));
    }

    return NextResponse.json({ challenges: challengesWithCounts });
  } catch (error) {
    console.error('Error fetching timed challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timed challenges' },
      { status: 500 }
    );
  }
}

