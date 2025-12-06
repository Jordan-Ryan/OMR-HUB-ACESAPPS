import ExerciseForm from '@/components/admin/ExerciseForm';

export default function EditExercisePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Edit Exercise</h1>
      <ExerciseForm exerciseId={params.id} />
    </div>
  );
}

