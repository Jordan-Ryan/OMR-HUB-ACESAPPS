import { Suspense } from 'react';
import PTSchedule from '@/components/admin/PTSchedule';

export default function PTSchedulePage() {
  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href="/admin/coach/schedule/create"
          className="button button-primary"
          style={{
            fontSize: '15px',
            padding: '12px 24px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Create PT Session
        </a>
      </div>
      <Suspense fallback={<div>Loading schedule...</div>}>
        <PTSchedule />
      </Suspense>
    </div>
  );
}

