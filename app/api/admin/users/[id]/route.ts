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
    const userId = params.id;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get credits
    const { data: circuitsCredit } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const { data: ptCredit } = await supabase
      .from('pt_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const { data: jointPtCredit } = await supabase
      .from('joint_pt_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    // Get activities (past and upcoming)
    const now = new Date().toISOString();
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .or(`host_user_id.eq.${userId},created_by.eq.${userId}`)
      .order('start_at', { ascending: false });

    // Filter activities based on current date (not time)
    // Only show activities that are active on the current day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999); // Set to end of day
    
    // Helper function to check if an activity is active on the current day
    const isActivityActiveToday = (activity: any) => {
      if (!activity.start_at) return false;
      
      const startDate = new Date(activity.start_at);
      startDate.setHours(0, 0, 0, 0);
      const endDate = activity.end_at ? new Date(activity.end_at) : startDate;
      endDate.setHours(23, 59, 59, 999);
      
      // Activity is active today if today falls within the activity's date range
      return startDate <= todayEnd && endDate >= today;
    };
    
    // Filter to only include activities active today
    const activitiesActiveToday = activities?.filter(isActivityActiveToday) || [];
    
    // Categorize: past activities have ended, upcoming activities are active or start in the future
    const pastActivities = activitiesActiveToday.filter((a) => {
      if (!a.start_at) return false;
      const endDate = a.end_at ? new Date(a.end_at) : new Date(a.start_at);
      endDate.setHours(23, 59, 59, 999);
      // If activity has ended before today, it's past
      return endDate < today;
    });
    
    const upcomingActivities = activitiesActiveToday.filter((a) => {
      if (!a.start_at) return false;
      const endDate = a.end_at ? new Date(a.end_at) : new Date(a.start_at);
      endDate.setHours(23, 59, 59, 999);
      // If activity hasn't ended yet, it's upcoming
      return endDate >= today;
    });

    // Get events the user is attending (not events they created)
    const { data: eventAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'attending');

    if (attendanceError) {
      console.error('Error fetching event attendance:', attendanceError);
    }

    const eventIds = eventAttendance?.map((ea) => ea.event_id) || [];
    
    let allEvents: any[] = [];
    if (eventIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('start_at', { ascending: false });
      
      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      }
      
      // Get attendance counts for each event
      if (events && events.length > 0) {
        const eventIdsForCount = events.map((e) => e.id);
        const { data: attendanceCounts } = await supabase
          .from('event_attendance')
          .select('event_id')
          .in('event_id', eventIdsForCount)
          .eq('status', 'attending');
        
        // Count attendees per event
        const countMap = new Map<string, number>();
        attendanceCounts?.forEach((attendance) => {
          const count = countMap.get(attendance.event_id) || 0;
          countMap.set(attendance.event_id, count + 1);
        });
        
        // Add attendance count to each event
        allEvents = events.map((event) => ({
          ...event,
          attendance_count: countMap.get(event.id) || 0,
        }));
      } else {
        allEvents = [];
      }
    }

    // Filter events based on current date (not time)
    // Only show events that are active on the current day
    // An event is active on the current day if today falls between start and end dates
    // Reuse the `today` and `todayEnd` variables defined earlier for activities
    
    // Helper function to check if an event is active on the current day
    const isEventActiveToday = (event: any) => {
      if (!event.start_at) return false;
      
      const startDate = new Date(event.start_at);
      startDate.setHours(0, 0, 0, 0);
      const endDate = event.end_at ? new Date(event.end_at) : startDate;
      endDate.setHours(23, 59, 59, 999);
      
      // Event is active today if today falls within the event's date range
      return startDate <= todayEnd && endDate >= today;
    };
    
    // Filter to only include events active today
    const eventsActiveToday = allEvents.filter(isEventActiveToday);
    
    // All events active today are considered "upcoming" (they're currently active)
    // Past events are those that ended before today (not shown since we filter to active today)
    const pastEvents: any[] = [];
    const upcomingEvents = eventsActiveToday;

    // Get workouts
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get assigned workouts
    const { data: assignedWorkouts } = await supabase
      .from('workout_assignments')
      .select(`
        *,
        workout:workouts(*),
        assigned_workout:workouts(*)
      `)
      .eq('assigned_to_user_id', userId)
      .order('assigned_at', { ascending: false });

    // Get challenges attended
    const { data: challengeSubmissions } = await supabase
      .from('community_challenge_submissions')
      .select(`
        *,
        challenge:community_challenges(*)
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    return NextResponse.json({
      profile,
      credits: {
        circuits: circuitsCredit?.balance || 0,
        pt: ptCredit?.balance || 0,
        joint_pt: jointPtCredit?.balance || 0,
      },
      activities: {
        past: pastActivities,
        upcoming: upcomingActivities,
      },
      events: {
        past: pastEvents,
        upcoming: upcomingEvents,
        all: allEvents || [],
      },
      workouts: workouts || [],
      assigned_workouts: assignedWorkouts || [],
      challenges: challengeSubmissions || [],
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

