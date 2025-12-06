import ActivityForm from '@/components/admin/ActivityForm';

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Edit PT Session</h1>
      <ActivityForm activityId={id} />
    </div>
  );
}

