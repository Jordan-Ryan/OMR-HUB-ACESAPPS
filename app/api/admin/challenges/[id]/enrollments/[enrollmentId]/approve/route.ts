import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const today = new Date().toISOString().split('T')[0];

    const { data: enrollment, error } = await supabase
      .from('challenge_enrollments')
      .update({
        status: 'onboarded',
        start_date: today,
      })
      .eq('id', params.enrollmentId)
      .eq('challenge_id', params.id)
      .select(`
        *,
        user:profiles(id, first_name, last_name, nickname, avatar_url)
      `)
      .single();

    if (error || !enrollment) {
      console.error('Error approving enrollment:', error);
      return NextResponse.json(
        {
          error: 'Failed to approve enrollment',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Error approving enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to approve enrollment' },
      { status: 500 }
    );
  }
}

