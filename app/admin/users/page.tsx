import { Suspense } from 'react';
import UserList from '@/components/admin/UserList';

export default function UsersPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading users...</div>}>
        <UserList />
      </Suspense>
    </div>
  );
}

