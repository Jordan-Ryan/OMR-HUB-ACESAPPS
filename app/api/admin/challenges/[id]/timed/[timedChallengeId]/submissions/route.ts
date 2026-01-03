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

    const { data: submissions, error } = await supabase
      .from('community_challenge_submissions')
      .select(`
        *,
        user:profiles(id, first_name, last_name, nickname, avatar_url)
      `)
      .eq('challenge_id', params.timedChallengeId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }

    return NextResponse.json({ submissions: submissions || [] });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

