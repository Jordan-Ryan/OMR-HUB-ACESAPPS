'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterTabs from '@/components/admin/FilterTabs';
import EventsList from '@/components/EventsList';
import { ClockIcon, CheckIcon } from '@/components/icons/AdminIcons';

type EventsTab = 'upcoming' | 'past';

function EventsContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as EventsTab) || 'upcoming';

  const tabItems = [
    { filter: 'upcoming', label: 'Upcoming', icon: <ClockIcon /> },
    { filter: 'past', label: 'Past', icon: <CheckIcon /> },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/events" filterKey="tab" defaultFilter="upcoming" />
      {/* Content */}
      <EventsList viewMode={activeTab} showCreateButton={true} />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div>Loading events...</div>}>
      <EventsContent />
    </Suspense>
  );
}

