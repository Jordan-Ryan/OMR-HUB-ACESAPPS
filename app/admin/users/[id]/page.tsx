import { Suspense } from 'react';
import UserDetail from '@/components/admin/UserDetail';

export default function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <Suspense fallback={<div style={{ color: '#FFFFFF', padding: '24px' }}>Loading user details...</div>}>
        <UserDetail userId={params.id} />
      </Suspense>
    </div>
  );
}

