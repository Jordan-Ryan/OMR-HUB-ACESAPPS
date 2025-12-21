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

    // Fetch event first
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch attendance separately - match the activities API structure exactly
    const { data: attendanceData } = await supabase
      .from('event_attendance')
      .select('user_id, status')
      .eq('event_id', params.id);

    // Fetch day-specific attendance from event_day_attendance table
    const { data: dayAttendanceData } = await supabase
      .from('event_day_attendance')
      .select('user_id, day_date, start_time')
      .eq('event_id', params.id);

    // Group day attendance by user_id, including start_time
    const dayAttendanceByUser = new Map<string, Array<{ day: string; start_time?: string | null }>>();
    dayAttendanceData?.forEach(day => {
      if (!dayAttendanceByUser.has(day.user_id)) {
        dayAttendanceByUser.set(day.user_id, []);
      }
      dayAttendanceByUser.get(day.user_id)!.push({
        day: day.day_date,
        start_time: day.start_time || null,
      });
    });

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

    // Attach attendance and profiles to event - match activities API structure
    // Build selected_days from event_day_attendance table
    const attendanceWithProfiles = attendanceData?.map(att => {
      // Get selected days from event_day_attendance table
      const dayData = dayAttendanceByUser.get(att.user_id) || [];
      const selectedDays = dayData.map(d => d.day);
      // Get start times by day
      const startTimesByDay = new Map<string, string | null>();
      dayData.forEach(d => {
        if (d.start_time) {
          startTimesByDay.set(d.day, d.start_time);
        }
      });
      
      return {
        user_id: att.user_id,
        status: att.status,
        selected_days: selectedDays.length > 0 ? selectedDays : null,
        start_times: startTimesByDay.size > 0 ? Object.fromEntries(startTimesByDay) : null,
        profiles: profilesMap.get(att.user_id) || null,
      };
    }) || [];

    const eventWithAttendance = {
      ...event,
      attendance: attendanceWithProfiles,
    };

    return NextResponse.json({ event: eventWithAttendance });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
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

    console.log('PUT event request body:', JSON.stringify(body, null, 2));
    console.log('Event ID:', params.id);

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

    // Prepare update data - convert empty strings to null
    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      start_at,
      end_at: end_at || null,
      location_name: location_name?.trim() || null,
      external_url: external_url?.trim() || null,
      image_url: image_url?.trim() || null,
      must_attend_all: mustAttendAllValue, // Always a boolean, never null
    };

    console.log('Update data being sent to Supabase:', updateData);

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !updatedEvent) {
      console.error('Error updating event:', error);
      console.error('Update payload:', {
        title,
        description,
        start_at,
        end_at,
        location_name,
        external_url,
        image_url,
        must_attend_all,
      });
      console.error('Event ID:', params.id);
      return NextResponse.json(
        { 
          error: 'Failed to update event',
          details: error?.message || 'Unknown error',
          code: error?.code || error?.hint || 'UNKNOWN'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
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

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
