import WorkoutForm from '@/components/admin/WorkoutForm';

export default function EditWorkoutPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Edit Workout</h1>
      <WorkoutForm workoutId={params.id} />
    </div>
  );
}

