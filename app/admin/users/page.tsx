'use client';

import { Suspense, useEffect, useState } from 'react';
import FilterTabs from '@/components/admin/FilterTabs';
import UserList from '@/components/admin/UserList';

function UsersContent() {
  const [userCounts, setUserCounts] = useState<{ members: number; guests: number }>({ members: 0, guests: 0 });

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        const users = data.users || [];
        const members = users.filter((u: any) => !u.is_guest).length;
        const guests = users.filter((u: any) => u.is_guest).length;
        setUserCounts({ members, guests });
      })
      .catch((error) => {
        console.error('Error fetching user counts:', error);
      });
  }, []);

  const tabItems = [
    { filter: 'members', label: 'Members', count: userCounts.members },
    { filter: 'guests', label: 'Guests', count: userCounts.guests },
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/users" filterKey="type" defaultFilter="members" />
      <UserList />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersContent />
    </Suspense>
  );
}

