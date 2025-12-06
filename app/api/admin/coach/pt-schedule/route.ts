import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Query PT activities first, then fetch attendance separately
    let query = supabase
      .from('activities')
      .select('*')
      .eq('activity_type', 'PT')
      .or(`host_user_id.eq.${admin.id},created_by.eq.${admin.id}`)
      .order('start_at', { ascending: true });

    if (startDate) {
      query = query.gte('start_at', startDate);
    }
    if (endDate) {
      query = query.lte('start_at', endDate);
    }

    const { data: activities, error } = await query;

    if (error) {
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

      // Get unique user IDs from attendance
      const userIds = [...new Set(attendanceData?.map(a => a.user_id) || [])];
      
      // Fetch profiles for these users
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, nickname')
          .in('id', userIds);
        
        profiles?.forEach(p => {
          profilesMap.set(p.id, p);
        });
      }

      // Attach attendance to activities
      activitiesWithAttendance = activities?.map(activity => {
        const attendance = attendanceData?.filter(a => a.activity_id === activity.id) || [];
        return {
          ...activity,
          attendance: attendance.map(a => ({
            user_id: a.user_id,
            status: a.status,
            profiles: profilesMap.get(a.user_id) || null,
          })),
        };
      }) || [];
    }

    return NextResponse.json({ activities: activitiesWithAttendance || [] });
  } catch (error) {
    console.error('Error fetching PT schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PT schedule' },
      { status: 500 }
    );
  }
}

