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

    // Fetch messages for this activity
    const { data: messages, error: messagesError } = await supabase
      .from('activity_messages')
      .select('id, message, created_at, user_id')
      .eq('activity_id', params.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ messages: [] });
    }

    // Get unique user IDs from messages
    const userIds = [...new Set(messages?.map(m => m.user_id) || [])];
    
    // Fetch profiles for message authors
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

    // Attach profiles to messages
    const messagesWithProfiles = messages?.map(msg => ({
      ...msg,
      profiles: profilesMap.get(msg.user_id) || null,
    })) || [];

    return NextResponse.json({ messages: messagesWithProfiles });
  } catch (error) {
    console.error('Error fetching activity messages:', error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create the message
    const { data: newMessage, error: messageError } = await supabase
      .from('activity_messages')
      .insert({
        activity_id: params.id,
        user_id: admin.id,
        message: message.trim(),
      })
      .select('id, message, created_at, user_id')
      .single();

    if (messageError || !newMessage) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Fetch profile for the message author
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, nickname, avatar_url')
      .eq('id', admin.id)
      .single();

    const messageWithProfile = {
      ...newMessage,
      profiles: profile || null,
    };

    return NextResponse.json({ message: messageWithProfile });
  } catch (error) {
    console.error('Error creating activity message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

