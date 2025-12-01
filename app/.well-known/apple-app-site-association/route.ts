import { NextResponse } from 'next/server';

export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'S7NY9U87TZ.com.omrhub.app',
          paths: ['/a/*'],
        },
      ],
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}


