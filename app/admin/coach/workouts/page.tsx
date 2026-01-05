'use client';

import { Suspense } from 'react';
import FilterTabs from '@/components/admin/FilterTabs';
import WorkoutList from '@/components/admin/WorkoutManagementList';
import { ListIcon, CoachIcon, GlobeIcon, LockIcon } from '@/components/icons/AdminIcons';

function WorkoutsContent() {
  const tabItems = [
    { filter: 'all', label: 'All Workouts', icon: <ListIcon /> },
    { filter: 'coach', label: 'Coach', icon: <CoachIcon /> },
    { filter: 'public', label: 'Public', icon: <GlobeIcon /> },
    { filter: 'private', label: 'Private', icon: <LockIcon /> },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/coach/workouts" filterKey="filter" defaultFilter="all" />
      <WorkoutList showCreateButton={true} />
    </div>
  );
}

export default function WorkoutsPage() {
  return (
    <Suspense fallback={<div>Loading workouts...</div>}>
      <WorkoutsContent />
    </Suspense>
  );
}

