import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    
    // Ensure we have the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('No authenticated user in Supabase client:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('Authenticated as admin user:', user.id);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const activityType = searchParams.get('activity_type');

    // Build the query - fetch all activities (admin can see all)
    // Query activities first, then fetch attendance separately to avoid relationship issues
    let query = supabase
      .from('activities')
      .select('*');

    // Filter by activity type if provided
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    // Order by start_at
    query = query.order('start_at', { ascending: true });

    const { data: activities, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Fetch attendance separately for each activity
    const activityIds = activities?.map(a => a.id) || [];
    let activitiesWithAttendance = activities || [];

    if (activityIds.length > 0) {
      const { data: attendanceData } = await supabase
        .from('activity_attendance')
        .select('activity_id, user_id, status')
        .in('activity_id', activityIds);

      // Get unique user IDs from attendance and hosts
      const userIds = [...new Set(attendanceData?.map(a => a.user_id) || [])];
      const hostIds = activities?.map(a => a.host_user_id).filter(Boolean) || [];
      const allUserIds = [...new Set([...userIds, ...hostIds])];
      
      // Fetch profiles for these users
      let profilesMap = new Map();
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, nickname, avatar_url')
          .in('id', allUserIds);
        
        profiles?.forEach(p => {
          profilesMap.set(p.id, p);
        });
      }

      // Attach attendance and host profiles to activities
      activitiesWithAttendance = activities?.map(activity => {
        const attendance = attendanceData?.filter(a => a.activity_id === activity.id) || [];
        return {
          ...activity,
          host_profile: activity.host_user_id ? profilesMap.get(activity.host_user_id) || null : null,
          attendance: attendance.map(a => ({
            user_id: a.user_id,
            status: a.status,
            profiles: profilesMap.get(a.user_id) || null,
          })),
        };
      }) || [];
    }

    console.log(`Fetched ${activitiesWithAttendance?.length || 0} activities from database`);
    return NextResponse.json({ activities: activitiesWithAttendance || [] });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error?.message },
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
      location_name,
      location_lat,
      location_lng,
      cost,
      activity_type,
      host_user_id,
      icon,
      route_link,
      visibility,
      attendees,
    } = body;

    if (!title || !start_at) {
      return NextResponse.json(
        { error: 'Title and start_at are required' },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        title,
        description: description || null,
        start_at,
        end_at: end_at || null,
        location_name: location_name || null,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        cost: cost || 1,
        activity_type: activity_type || 'Circuits',
        host_user_id: host_user_id || admin.id,
        created_by: admin.id,
        created_by_admin: true,
        kind: 'organised',
        visibility: visibility || 'private',
        icon: icon || null,
        route_url: route_link || null,
      })
      .select()
      .single();

    if (activityError || !activity) {
      console.error('Supabase insert error:', activityError);
      return NextResponse.json(
        { error: 'Failed to create activity', details: activityError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // Add attendees if provided
    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      const attendanceRecords = attendees.map((userId: string) => ({
        activity_id: activity.id,
        user_id: userId,
        status: 'attending',
      }));

      const { error: attendanceError } = await supabase
        .from('activity_attendance')
        .insert(attendanceRecords);

      if (attendanceError) {
        console.error('Error adding attendance:', attendanceError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
