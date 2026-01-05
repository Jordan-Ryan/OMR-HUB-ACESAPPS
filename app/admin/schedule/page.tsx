'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterTabs from '@/components/admin/FilterTabs';
import ScheduleList from '@/components/ScheduleList';
import BulkCreationTemplate from '@/components/BulkCreationTemplate';
import CircuitAttendanceChart from '@/components/CircuitAttendanceChart';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ClipboardIcon,
  PeopleIcon,
} from '@/components/icons/AdminIcons';

type ScheduleTab = 'upcoming' | 'past' | 'circuits' | 'running' | 'pilates' | 'bulk-creation' | 'circuit-attendance';

function ScheduleContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as ScheduleTab) || 'upcoming';

  const tabItems = [
    { filter: 'upcoming', label: 'Upcoming', icon: <ClockIcon /> },
    { filter: 'past', label: 'Past', icon: <CheckIcon /> },
    { filter: 'circuits', label: 'Circuits', icon: <CalendarIcon /> },
    { filter: 'running', label: 'Running', icon: <CalendarIcon /> },
    { filter: 'pilates', label: 'Pilates', icon: <CalendarIcon /> },
    { filter: 'circuit-attendance', label: 'Circuit Attendance', icon: <PeopleIcon /> },
    { filter: 'bulk-creation', label: 'Bulk Creation', icon: <ClipboardIcon /> },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/schedule" filterKey="tab" defaultFilter="upcoming" />
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

