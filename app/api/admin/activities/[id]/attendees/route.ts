import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

// Add attendee to activity
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { user_id, status } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists
    const { data: existing } = await supabase
      .from('activity_attendance')
      .select('id')
      .eq('activity_id', params.id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      // Update existing record
      const { data: attendance, error: updateError } = await supabase
        .from('activity_attendance')
        .update({
          status: status || 'attending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('user_id, status')
        .single();

      if (updateError || !attendance) {
        return NextResponse.json(
          { error: 'Failed to update attendance' },
          { status: 500 }
        );
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, avatar_url')
        .eq('id', user_id)
        .single();

      return NextResponse.json({
        attendance: {
          ...attendance,
          profiles: profile || null,
        },
      });
    } else {
      // Create new attendance record
      const { data: attendance, error: insertError } = await supabase
        .from('activity_attendance')
        .insert({
          activity_id: params.id,
          user_id,
          status: status || 'attending',
        })
        .select('user_id, status')
        .single();

      if (insertError || !attendance) {
        return NextResponse.json(
          { error: 'Failed to add attendee' },
          { status: 500 }
        );
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, avatar_url')
        .eq('id', user_id)
        .single();

      return NextResponse.json({
        attendance: {
          ...attendance,
          profiles: profile || null,
        },
      });
    }
  } catch (error) {
    console.error('Error adding attendee:', error);
    return NextResponse.json(
      { error: 'Failed to add attendee' },
      { status: 500 }
    );
  }
}

// Remove attendee from activity
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('activity_attendance')
      .delete()
      .eq('activity_id', params.id)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error removing attendee:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove attendee' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing attendee:', error);
    return NextResponse.json(
      { error: 'Failed to remove attendee' },
      { status: 500 }
    );
  }
}


