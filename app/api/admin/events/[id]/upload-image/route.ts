import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate file path matching app format: event-{eventId}-{timestamp}.{extension}
    // This matches the format used by the app: event-{eventId}-{timestamp}-{random}.jpg
    let fileExtension = 'jpg'; // default
    if (file.name && file.name.includes('.')) {
      fileExtension = file.name.split('.').pop() || 'jpg';
    } else {
      // Try to determine from MIME type
      if (file.type === 'image/png') fileExtension = 'png';
      else if (file.type === 'image/webp') fileExtension = 'webp';
      else if (file.type === 'image/gif') fileExtension = 'gif';
      else fileExtension = 'jpg';
    }
    
    // Generate timestamp and random string to match app format
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `event-${params.id}-${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = fileName; // Store at root of bucket, not in subfolder

    // Validate file has content
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Convert File to Blob for upload
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'File data is empty' },
        { status: 400 }
      );
    }
    
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Upload to Supabase Storage
    // Use 'activity-images' bucket (with 's') to match app format
    // This is the bucket the app expects for event/activity images
    const bucketsToTry = [
      'activity-images',  // Preferred - matches app format (note the 's')
      'activity-image',   // Fallback without 's'
      'images',           // Generic images bucket
      'event-images',     // Event-specific bucket
      'avatars'           // Last resort fallback
    ];
    
    let data = null;
    let error = null;
    let successfulBucket = null;
    let lastErrorDetails: any = null;

    for (const bucket of bucketsToTry) {
      console.log(`Attempting upload to bucket: ${bucket}`);
      try {
        const result = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, {
            contentType: file.type,
            upsert: true, // Replace if exists
          });
        
        if (!result.error) {
          data = result.data;
          successfulBucket = bucket;
          error = null;
          lastErrorDetails = null;
          console.log(`Successfully uploaded to bucket: ${bucket}`, result.data);
          break;
        }
        
        lastErrorDetails = result.error;
        error = result.error;
        console.log(`Failed to upload to bucket ${bucket}:`, result.error?.message || result.error);
      } catch (uploadError: any) {
        console.error(`Exception uploading to bucket ${bucket}:`, uploadError);
        lastErrorDetails = uploadError;
        error = uploadError;
      }
    }

    if (error && !successfulBucket) {
      console.error('Error uploading image after trying all buckets:', error);
      console.error('Last error details:', JSON.stringify(lastErrorDetails, null, 2));
      console.error('File path:', filePath);
      console.error('File size:', file.size);
      console.error('File type:', file.type);
      console.error('Tried buckets:', bucketsToTry);
      console.error('Successful bucket:', successfulBucket);
      
      // Try to get list of available buckets for better error message
      let availableBuckets: string[] = [];
      try {
        const { data: bucketsList } = await supabase.storage.listBuckets();
        availableBuckets = bucketsList?.map(b => b.name) || [];
        console.log('Available buckets:', availableBuckets);
      } catch (listError) {
        console.log('Could not list buckets:', listError);
      }
      
      // Provide helpful error message if bucket doesn't exist
      if (error.message?.includes('not found') || error.statusCode === '404' || error.error === '404' || error.message?.includes('Bucket') || lastErrorDetails?.message?.includes('not found')) {
        const bucketInfo = availableBuckets.length > 0 
          ? `Found buckets: ${availableBuckets.join(', ')}. None of these are suitable for event images.`
          : 'Could not find any storage buckets.';
        
        return NextResponse.json(
          { 
            error: 'Storage bucket not found',
            details: `${bucketInfo} Please create a bucket named 'activity-image' (or 'images') in your Supabase Storage dashboard: 1) Go to Storage, 2) Click "New bucket", 3) Name it "activity-image", 4) Make it Public, 5) Save.`,
            code: 'BUCKET_NOT_FOUND',
            triedBuckets: bucketsToTry,
            availableBuckets: availableBuckets,
            help: 'Create bucket at: Supabase Dashboard > Storage > New bucket > Name: "activity-image" > Public: ON > Create'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to upload image',
          details: error.message || lastErrorDetails?.message || 'Unknown error',
          code: error.statusCode || error.error || lastErrorDetails?.statusCode || 'UNKNOWN',
          lastError: lastErrorDetails
        },
        { status: 500 }
      );
    }

    // Return the storage path
    if (!successfulBucket) {
      console.error('Upload failed - no successful bucket found');
      return NextResponse.json(
        { 
          error: 'Failed to upload image',
          details: 'Upload failed for all attempted buckets',
          code: 'UPLOAD_FAILED'
        },
        { status: 500 }
      );
    }

    // Generate a signed URL with 1 year expiry (matching app format)
    // The app stores full signed URLs in the database, so we'll do the same
    const { data: urlData, error: urlError } = await supabase.storage
      .from(successfulBucket)
      .createSignedUrl(filePath, 31536000); // 1 year expiry (31536000 seconds)

    if (urlError) {
      console.warn('Could not generate signed URL:', urlError);
      // Still return the path even if URL generation fails
      return NextResponse.json({ 
        path: filePath,
        bucket: successfulBucket,
        url: null,
        success: true 
      });
    }

    // Return both the path and the full signed URL
    // The app expects full signed URLs stored in image_url field
    return NextResponse.json({ 
      path: filePath,
      bucket: successfulBucket,
      url: urlData?.signedUrl || null, // Full signed URL (1 year expiry) - store this in database
      success: true 
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error?.message || 'Unknown error',
        type: error?.name || 'Error'
      },
      { status: 500 }
    );
  }
}
