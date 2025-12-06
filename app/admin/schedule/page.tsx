'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ScheduleList from '@/components/ScheduleList';
import BulkCreationTemplate from '@/components/BulkCreationTemplate';
import CircuitAttendanceChart from '@/components/CircuitAttendanceChart';

type ScheduleTab = 'upcoming' | 'past' | 'circuits' | 'running' | 'pilates' | 'bulk-creation' | 'circuit-attendance';

function ScheduleContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as ScheduleTab) || 'upcoming';

  return (
    <div>
      {/* Content */}
      {activeTab === 'bulk-creation' ? (
        <BulkCreationTemplate />
      ) : activeTab === 'circuit-attendance' ? (
        <CircuitAttendanceChart />
      ) : (
        <ScheduleList
          filter={activeTab}
          activityType={
            activeTab === 'circuits'
              ? 'Circuits'
              : activeTab === 'running'
              ? 'Running'
              : activeTab === 'pilates'
              ? 'Pilates'
              : undefined
          }
          showCreateButton={true}
        />
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Loading schedule...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}

