import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get all users with their credits
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, nickname, avatar_url, created_at, is_guest')
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw profilesError;
    }

    // Get all credits
    const { data: circuitsCredits } = await supabase
      .from('credits')
      .select('user_id, balance');

    const { data: ptCredits } = await supabase
      .from('pt_credits')
      .select('user_id, balance');

    const { data: jointPtCredits } = await supabase
      .from('joint_pt_credits')
      .select('user_id, balance');

    // Get active subscriptions (get the latest end_date for each user)
    const { data: allSubscriptions } = await supabase
      .from('unlimited_subscriptions')
      .select('user_id, end_date')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: false });

    // Get the latest subscription for each user
    const subscriptionsMap = new Map<string, string>();
    allSubscriptions?.forEach((sub) => {
      if (!subscriptionsMap.has(sub.user_id) || 
          (subscriptionsMap.get(sub.user_id) && sub.end_date > subscriptionsMap.get(sub.user_id)!)) {
        subscriptionsMap.set(sub.user_id, sub.end_date);
      }
    });

    // Get emails from auth.users using the database function
    const userIds = profiles?.map((p) => p.id) || [];
    const emailsMap: Record<string, string> = {};

    if (userIds.length > 0) {
      try {
        // Split into batches to avoid timeout
        const batchSize = 100;
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize);
          const { data: emailData, error: emailError } = await supabase
            .rpc('get_user_emails_batch', { user_ids: batch });
        
          if (emailError) {
            console.error('Error fetching emails batch:', emailError);
            console.error('Batch size:', batch.length, 'First user ID:', batch[0]);
          } else if (emailData && Array.isArray(emailData)) {
            emailData.forEach((item: any) => {
              if (item.user_id && item.email) {
                emailsMap[item.user_id] = item.email;
              }
            });
          } else {
            console.log('No email data returned for batch:', batch.length);
          }
        }
        console.log(`Fetched ${Object.keys(emailsMap).length} emails out of ${userIds.length} users`);
      } catch (error) {
        console.error('Error fetching emails:', error);
        // Continue without emails if function fails
      }
    }

    // Combine data
    const usersWithCredits = profiles?.map((profile) => {
      const circuitsCredit = circuitsCredits?.find((c) => c.user_id === profile.id);
      const ptCredit = ptCredits?.find((c) => c.user_id === profile.id);
      const jointPtCredit = jointPtCredits?.find((c) => c.user_id === profile.id);
      const subscriptionEndDate = subscriptionsMap.get(profile.id) || null;

      return {
        ...profile,
        email: emailsMap[profile.id] || null,
        circuits_credits: circuitsCredit?.balance || 0,
        pt_credits: ptCredit?.balance || 0,
        joint_pt_credits: jointPtCredit?.balance || 0,
        subscription_end_date: subscriptionEndDate,
        is_guest: profile.is_guest || false,
      };
    });

    return NextResponse.json({ users: usersWithCredits || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

