'use client';

import { Suspense } from 'react';
import FilterTabs from '@/components/admin/FilterTabs';
import CreditList from '@/components/admin/CreditList';
import { CalendarIcon, CoachIcon, PeopleIcon } from '@/components/icons/AdminIcons';

function CreditsContent() {
  const tabItems = [
    { filter: 'circuits', label: 'Circuits', icon: <CalendarIcon /> },
    { filter: 'pt', label: 'PT', icon: <CoachIcon /> },
    { filter: 'partner-pt', label: 'Partner PT', icon: <PeopleIcon /> },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/credits" filterKey="type" defaultFilter="circuits" />
      <CreditList />
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div>Loading transactions...</div>}>
      <CreditsContent />
    </Suspense>
  );
}
