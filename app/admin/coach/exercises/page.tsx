import { Suspense } from 'react';
import ExerciseList from '@/components/admin/ExerciseList';

export default function ExercisesPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading exercises...</div>}>
        <ExerciseList />
      </Suspense>
    </div>
  );
}

