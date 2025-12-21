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

    // Try different bucket names - events use 'activity-images' (with 's') to match app format
    const buckets = ['activity-images', 'activity-image', 'images', 'event-images', 'avatars'];
    let lastError = null;

    for (const bucketName of buckets) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, 3600); // 1 hour

      if (!error && data) {
        return NextResponse.json({ url: data.signedUrl || null });
      }
      lastError = error;
    }

    // If all buckets failed, return error
    console.error('Error creating signed URL for event image:', lastError);
    return NextResponse.json(
      { error: 'Failed to create signed URL', details: lastError?.message },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error getting event image URL:', error);
    return NextResponse.json(
      { error: 'Failed to get event image URL' },
      { status: 500 }
    );
  }
}
