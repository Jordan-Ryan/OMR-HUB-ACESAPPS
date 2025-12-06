import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Fetch all Circuits activities with their attendance
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, start_at, end_at, location_name')
      .eq('activity_type', 'Circuits')
      .order('start_at', { ascending: true });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ 
        attendanceData: [],
        summary: {
          totalSessions: 0,
          totalAttendance: 0,
          averageAttendance: 0,
        }
      });
    }

    // Fetch attendance for all circuit activities
    const activityIds = activities.map(a => a.id);
    const { data: attendance, error: attendanceError } = await supabase
      .from('activity_attendance')
      .select('activity_id, user_id, status')
      .in('activity_id', activityIds)
      .eq('status', 'attending');

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Group attendance by day and time slot
    const attendanceByDayTime = new Map<string, {
      day: string;
      timeSlot: string;
      date: Date;
      activities: Array<{
        id: string;
        title: string;
        start_at: string;
        end_at: string | null;
        location_name: string | null;
        attendanceCount: number;
      }>;
      totalAttendance: number;
    }>();

    activities.forEach(activity => {
      const startDate = new Date(activity.start_at);
      const dayKey = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeSlot = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Group by day and time (e.g., "Monday 9:00 AM")
      const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
      const key = `${dayKey}-${timeSlot}`;

      const attendanceCount = attendance?.filter(a => a.activity_id === activity.id).length || 0;

      if (!attendanceByDayTime.has(key)) {
        attendanceByDayTime.set(key, {
          day: dayName,
          timeSlot,
          date: startDate,
          activities: [],
          totalAttendance: 0,
        });
      }

      const dayTimeData = attendanceByDayTime.get(key)!;
      dayTimeData.activities.push({
        id: activity.id,
        title: activity.title,
        start_at: activity.start_at,
        end_at: activity.end_at,
        location_name: activity.location_name,
        attendanceCount,
      });
      dayTimeData.totalAttendance += attendanceCount;
    });

    // Convert to array and sort by date, then by time
    const attendanceData = Array.from(attendanceByDayTime.values())
      .sort((a, b) => {
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by time
        return a.timeSlot.localeCompare(b.timeSlot);
      })
      .map(point => ({
        ...point,
        date: point.date.toISOString(), // Convert to ISO string for JSON serialization
      }));

    // Calculate summary statistics
    const totalSessions = activities.length;
    const totalAttendance = attendance?.length || 0;
    const averageAttendance = totalSessions > 0 ? totalAttendance / totalSessions : 0;

    return NextResponse.json({
      attendanceData,
      summary: {
        totalSessions,
        totalAttendance,
        averageAttendance: Math.round(averageAttendance * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching circuit attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circuit attendance' },
      { status: 500 }
    );
  }
}

