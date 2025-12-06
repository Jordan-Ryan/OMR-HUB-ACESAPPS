import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'circuits';

    let transactions: any[] = [];
    let tableName = 'credit_transactions';

    // Determine which table to query based on type
    if (type === 'pt') {
      tableName = 'pt_credit_transactions';
    } else if (type === 'partner-pt') {
      tableName = 'joint_pt_credit_transactions';
    }

    // Fetch transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from(tableName)
      .select('id, user_id, amount, activity_id, description, created_at')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      throw transactionsError;
    }

    // Get unique user IDs and activity IDs
    const userIds = [...new Set(transactionsData?.map((t: any) => t.user_id) || [])];
    const activityIds = [...new Set(transactionsData?.map((t: any) => t.activity_id).filter((id: any) => id) || [])];
    
    const usersMap: Record<string, any> = {};
    const activitiesMap: Record<string, any> = {};

    // Fetch user profiles
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        throw profilesError;
      }

      profiles?.forEach((profile) => {
        usersMap[profile.id] = profile;
      });
    }

    // Fetch activities
    if (activityIds.length > 0) {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, activity_type, start_at')
        .in('id', activityIds);

      if (activitiesError) {
        throw activitiesError;
      }

      activities?.forEach((activity) => {
        activitiesMap[activity.id] = activity;
      });
    }

    // Combine data with user names and activity names
    transactions = (transactionsData || []).map((transaction: any) => {
      const user = usersMap[transaction.user_id];
      const userName = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'
        : 'Unknown User';

      const activity = transaction.activity_id ? activitiesMap[transaction.activity_id] : null;
      const activityName = activity?.title || transaction.description || 'N/A';
      const activityDate = activity?.start_at || null;

      return {
        id: transaction.id,
        user_id: transaction.user_id,
        user_name: userName,
        avatar_url: user?.avatar_url || null,
        amount: transaction.amount,
        activity_id: transaction.activity_id,
        activity_name: activityName,
        activity_date: activityDate,
        activity_type: activity?.activity_type || null,
        description: transaction.description,
        created_at: transaction.created_at,
      };
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit transactions' },
      { status: 500 }
    );
  }
}

