import Link from 'next/link';
import ActivityForm from '@/components/admin/ActivityForm';

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <Link
        href={`/admin/coach/schedule/${id}`}
        style={{
          color: '#007AFF',
          textDecoration: 'none',
          marginBottom: '24px',
          display: 'inline-block',
          fontSize: '17px',
          fontWeight: '500',
          transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#0051D5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#007AFF';
        }}
      >
        ← Back to PT Session
      </Link>
      <h1 style={{ marginBottom: '32px', marginTop: 0 }}>Edit PT Session</h1>
      <ActivityForm activityId={id} />
    </div>
  );
}

