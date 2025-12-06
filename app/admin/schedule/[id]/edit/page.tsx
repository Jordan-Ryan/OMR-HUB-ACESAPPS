import ActivityEditForm from '@/components/admin/ActivityEditForm';

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <ActivityEditForm activityId={id} />
    </div>
  );
}

