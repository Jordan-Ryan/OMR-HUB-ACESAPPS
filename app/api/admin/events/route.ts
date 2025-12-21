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

    // Query from events table
    // Query events first, then fetch attendance separately
    let query = supabase
      .from('events')
      .select('*')
      .order('start_at', { ascending: true });

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('start_at', startDate);
    }
    if (endDate) {
      query = query.lte('start_at', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Fetch attendance separately
    const eventIds = events?.map(e => e.id) || [];
    let eventsWithAttendance = events || [];

    if (eventIds.length > 0) {
      const { data: attendanceData } = await supabase
        .from('event_attendance')
        .select('event_id, user_id, status')
        .in('event_id', eventIds);

      // Get unique user IDs
      const userIds = [...new Set(attendanceData?.map(a => a.user_id) || [])];
      
      // Fetch profiles
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

      // Attach attendance to events
      eventsWithAttendance = events?.map(event => {
        const attendance = attendanceData?.filter(a => a.event_id === event.id) || [];
        return {
          ...event,
          attendance: attendance.map(a => ({
            user_id: a.user_id,
            status: a.status,
            profiles: profilesMap.get(a.user_id) || null,
          })),
        };
      }) || [];
    }

    console.log(`Fetched ${eventsWithAttendance?.length || 0} events from database`);

    // Add attendance counts
    const eventsWithCounts = eventsWithAttendance.map((event: any) => {
      const attendingCount = event.attendance?.filter((a: any) => a.status === 'attending').length || 0;
      return {
        ...event,
        attendance_count: attendingCount,
      };
    });

    return NextResponse.json({ events: eventsWithCounts });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    console.log('POST event request body:', JSON.stringify(body, null, 2));

    const {
      title,
      description,
      start_at,
      end_at,
      location_name,
      external_url,
      image_url,
      must_attend_all,
    } = body;

    if (!title || !start_at) {
      return NextResponse.json(
        { error: 'Title and start_at are required' },
        { status: 400 }
      );
    }

    // Determine if event is multi-day
    const startDate = new Date(start_at);
    const endDate = end_at ? new Date(end_at) : startDate;
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const isMultiDay = startDateOnly.getTime() !== endDateOnly.getTime();
    
    // For single-day events, must_attend_all must be false (can't "attend all days" of a single day)
    // For multi-day events, use the provided value or default to false
    const mustAttendAllValue = isMultiDay ? (must_attend_all === true) : false;

    // Prepare insert data - convert empty strings to null
    const insertData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      start_at,
      end_at: end_at || null,
      location_name: location_name?.trim() || null,
      external_url: external_url?.trim() || null,
      image_url: image_url?.trim() || null,
      must_attend_all: mustAttendAllValue, // Always a boolean, never null
      created_by: admin.id,
    };

    console.log('Insert data being sent to Supabase:', insertData);

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (eventError || !event) {
      console.error('Error creating event:', eventError);
      console.error('Insert payload:', insertData);
      return NextResponse.json(
        { 
          error: 'Failed to create event',
          details: eventError?.message || 'Unknown error',
          code: eventError?.code || eventError?.hint || 'UNKNOWN'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
