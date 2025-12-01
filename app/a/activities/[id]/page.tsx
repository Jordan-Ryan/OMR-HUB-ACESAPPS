import { Metadata } from 'next';
import DeepLinkPage from '@/components/DeepLinkPage';

interface ActivityPageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Open in OMR Hub',
  description: 'Open this activity in the OMR Hub app',
  other: {
    'apple-itunes-app': 'app-id=6755069825',
  },
};

export default function ActivityDeepLinkPage({ params }: ActivityPageProps) {
  const { id } = params;
  return <DeepLinkPage type="activities" id={id} />;
}