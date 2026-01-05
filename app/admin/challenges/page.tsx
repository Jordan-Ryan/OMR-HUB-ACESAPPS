'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterTabs from '@/components/admin/FilterTabs';
import AdminChallengeList from '@/components/admin/AdminChallengeList';

function ChallengesContent() {
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get('status') as 'all' | 'upcoming' | 'active' | 'past') || 'all';

  const tabItems = [
    { filter: 'all', label: 'All Challenges' },
    { filter: 'upcoming', label: 'Upcoming' },
    { filter: 'active', label: 'Active' },
    { filter: 'past', label: 'Past' },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/challenges" filterKey="status" defaultFilter="all" />
      <AdminChallengeList showCreateButton={true} />
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <Suspense fallback={<div>Loading challenges...</div>}>
      <ChallengesContent />
    </Suspense>
  );
}

