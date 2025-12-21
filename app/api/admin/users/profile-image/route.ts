import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // If it's already a full URL, return it
    if (path.startsWith('http')) {
      return NextResponse.json({ url: path });
    }

    // Create signed URL with 1 hour expiry
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, 3600); // 1 hour

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to create signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data?.signedUrl || null });
  } catch (error) {
    console.error('Error getting profile image URL:', error);
    return NextResponse.json(
      { error: 'Failed to get profile image URL' },
      { status: 500 }
    );
  }
}



