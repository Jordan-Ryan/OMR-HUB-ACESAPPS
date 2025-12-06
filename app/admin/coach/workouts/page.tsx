import { Suspense } from 'react';
import WorkoutList from '@/components/admin/WorkoutManagementList';

export default function WorkoutsPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading workouts...</div>}>
        <WorkoutList showCreateButton={true} />
      </Suspense>
    </div>
  );
}

