import { Metadata } from 'next';
import DeepLinkPage from '@/components/DeepLinkPage';

interface EventPageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Open in OMR Hub',
  description: 'Open this event in the OMR Hub app',
  other: {
    'apple-itunes-app': 'app-id=6755069825',
  },
};

export default function EventDeepLinkPage({ params }: EventPageProps) {
  const { id } = params;
  return <DeepLinkPage type="events" id={id} />;
}