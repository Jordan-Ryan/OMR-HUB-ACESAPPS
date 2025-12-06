import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const exerciseId = formData.get('exerciseId') as string;
    const gender = formData.get('gender') as string; // 'male' or 'female'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return NextResponse.json(
        { error: 'Gender must be "male" or "female"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/m4v'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, MOV, AVI, and M4V files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Generate file path: exercises/{exerciseId}/video_{gender}.mp4
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const fileName = `video_${gender}.${fileExtension}`;
    const filePath = `exercises/${exerciseId}/${fileName}`;

    // Convert File to Blob for upload
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('exercise-videos')
      .upload(filePath, blob, {
        contentType: file.type,
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('Error uploading video:', error);
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      );
    }

    // Return the storage path (not a signed URL, as we'll generate those when needed)
    return NextResponse.json({ 
      path: filePath,
      success: true 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

