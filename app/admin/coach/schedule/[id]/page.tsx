import ActivityDetail from '@/components/admin/ActivityDetail';

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivityDetail activityId={id} />;
}

