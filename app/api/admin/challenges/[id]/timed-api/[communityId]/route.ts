import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; communityId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: challenge, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('id', params.communityId)
      .eq('challenge_id', params.id)
      .single();

    if (error || !challenge) {
      return NextResponse.json(
        { error: 'Community challenge not found' },
        { status: 404 }
      );
    }

    // Get submission count
    const { count: submissionCount } = await supabase
      .from('community_challenge_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.communityId);

    return NextResponse.json({
      challenge: {
        ...challenge,
        submission_count: submissionCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching community challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community challenge' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; communityId: string } }
) {
  try {
    await requireAdmin();
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

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be on or after start date' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (challenge_type !== undefined) updateData.challenge_type = challenge_type;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (linked_challenge_id !== undefined) updateData.linked_challenge_id = linked_challenge_id || null;

    const { data: updatedChallenge, error } = await supabase
      .from('community_challenges')
      .update(updateData)
      .eq('id', params.communityId)
      .eq('challenge_id', params.id)
      .select()
      .single();

    if (error || !updatedChallenge) {
      console.error('Error updating community challenge:', error);
      return NextResponse.json(
        {
          error: 'Failed to update community challenge',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge: updatedChallenge });
  } catch (error) {
    console.error('Error updating community challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update community challenge' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; communityId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Check if challenge has submissions
    const { count: submissionCount } = await supabase
      .from('community_challenge_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', params.communityId);

    if (submissionCount && submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete community challenge with existing submissions' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('community_challenges')
      .delete()
      .eq('id', params.communityId)
      .eq('challenge_id', params.id);

    if (error) {
      console.error('Error deleting community challenge:', error);
      return NextResponse.json(
        { error: 'Failed to delete community challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting community challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete community challenge' },
      { status: 500 }
    );
  }
}

