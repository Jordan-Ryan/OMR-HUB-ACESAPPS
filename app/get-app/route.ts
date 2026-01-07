import { NextRequest, NextResponse } from 'next/server';

const APP_STORE_URL = 'https://apps.apple.com/gb/app/omr-hub/id6755069825';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.omrhub.app';

export function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect iOS devices
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  
  // Detect Android devices
  const isAndroid = /Android/i.test(userAgent);
  
  // Determine redirect URL
  let redirectUrl: string;
  
  if (isIOS) {
    redirectUrl = APP_STORE_URL;
  } else if (isAndroid) {
    redirectUrl = PLAY_STORE_URL;
  } else {
    // Fallback to App Store for desktop/unknown devices
    redirectUrl = APP_STORE_URL;
  }
  
  // Return 302 redirect
  return NextResponse.redirect(redirectUrl, { status: 302 });
}

