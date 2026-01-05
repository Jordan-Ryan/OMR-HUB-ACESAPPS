'use client';

import { Suspense } from 'react';
import FilterTabs from '@/components/admin/FilterTabs';
import PTSchedule from '@/components/admin/PTSchedule';
import { CalendarIcon, ClockIcon, CheckIcon } from '@/components/icons/AdminIcons';

function PTScheduleContent() {
  const tabItems = [
    { filter: 'all', label: 'All Sessions', icon: <CalendarIcon /> },
    { filter: 'upcoming', label: 'Upcoming', icon: <ClockIcon /> },
    { filter: 'past', label: 'Past', icon: <CheckIcon /> },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/coach/schedule" filterKey="view" defaultFilter="all" />
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
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
      <PTSchedule />
    </div>
  );
}

export default function PTSchedulePage() {
  return (
    <Suspense fallback={<div>Loading schedule...</div>}>
      <PTScheduleContent />
    </Suspense>
  );
}

