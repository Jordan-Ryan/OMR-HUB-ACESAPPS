'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EventsList from '@/components/EventsList';

type EventsTab = 'upcoming' | 'past';

function EventsContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as EventsTab) || 'upcoming';

  return (
    <div>
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

