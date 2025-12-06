import { Suspense } from 'react';
import CreditList from '@/components/admin/CreditList';

export default function CreditsPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading transactions...</div>}>
        <CreditList />
      </Suspense>
    </div>
  );
}
