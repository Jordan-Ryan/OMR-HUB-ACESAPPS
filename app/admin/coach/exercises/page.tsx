'use client';

import { Suspense, useEffect, useState } from 'react';
import FilterTabs from '@/components/admin/FilterTabs';
import ExerciseList from '@/components/admin/ExerciseList';
import { ClipboardIcon } from '@/components/icons/AdminIcons';

function ExercisesContent() {
  const [muscleGroups, setMuscleGroups] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    fetch('/api/admin/exercises')
      .then((res) => res.json())
      .then((data) => {
        const exercises = data.exercises || [];
        const muscleGroupMap = new Map<string, number>();
        
        exercises.forEach((exercise: any) => {
          if (exercise.muscle_groups && Array.isArray(exercise.muscle_groups)) {
            exercise.muscle_groups.forEach((mg: string) => {
              const currentCount = muscleGroupMap.get(mg) || 0;
              muscleGroupMap.set(mg, currentCount + 1);
            });
          }
        });
        
        const muscleGroupsList = Array.from(muscleGroupMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setMuscleGroups(muscleGroupsList);
      })
      .catch((error) => {
        console.error('Error fetching muscle groups:', error);
      });
  }, []);

  const allCount = muscleGroups.reduce((sum, mg) => sum + mg.count, 0);
  const tabItems = [
    { filter: 'all', label: 'All Exercises', icon: <ClipboardIcon />, count: allCount },
    ...muscleGroups.map((mg) => ({
      filter: mg.name.toLowerCase().trim().replace(/\s+/g, '-'),
      label: mg.name,
      count: mg.count,
    })),
  ];

  return (
    <div>
      <FilterTabs items={tabItems} basePath="/admin/coach/exercises" filterKey="muscle_group" defaultFilter="all" />
      <ExerciseList />
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<div>Loading exercises...</div>}>
      <ExercisesContent />
    </Suspense>
  );
}

