import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Fetch activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', params.id)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Fetch attendance separately
    const { data: attendanceData } = await supabase
      .from('activity_attendance')
      .select('user_id, status')
      .eq('activity_id', params.id);

    // Get unique user IDs from attendance
    const userIds = [...new Set(attendanceData?.map(a => a.user_id) || [])];
    
    // Fetch profiles for attendees
    let profilesMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, avatar_url')
        .in('id', userIds);
      
      profiles?.forEach(p => {
        profilesMap.set(p.id, p);
      });
    }

    // Fetch host profile if host_user_id exists
    let hostProfile = null;
    if (activity.host_user_id) {
      const { data: host } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, avatar_url')
        .eq('id', activity.host_user_id)
        .single();
      
      if (host) {
        hostProfile = host;
      }
    }

    // Attach attendance and host profile to activity
    const activityWithDetails = {
      ...activity,
      host_profile: hostProfile,
      attendance: attendanceData?.map(a => ({
        user_id: a.user_id,
        status: a.status,
        profiles: profilesMap.get(a.user_id) || null,
      })) || [],
    };

    return NextResponse.json({ activity: activityWithDetails });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
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
      location_name,
      location_lat,
      location_lng,
      cost,
      activity_type,
      host_user_id,
      icon,
      route_link,
    } = body;

    if (!title || !start_at) {
      return NextResponse.json(
        { error: 'Title and start_at are required' },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .update({
        title,
        description: description || null,
        start_at,
        end_at: end_at || null,
        location_name: location_name || null,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        cost: cost !== undefined && cost !== null ? cost : 0,
        activity_type: activity_type || 'Circuits',
        host_user_id: host_user_id || null,
        icon: icon || null,
        route_url: route_link || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
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

    // Delete related records first (messages and attendance)
    await supabase
      .from('activity_messages')
      .delete()
      .eq('activity_id', params.id);

    await supabase
      .from('activity_attendance')
      .delete()
      .eq('activity_id', params.id);

    // Delete the activity
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting activity:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}

