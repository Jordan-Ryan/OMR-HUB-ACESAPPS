import { Metadata } from 'next';
import DeepLinkPage from '@/components/DeepLinkPage';

interface WorkoutPageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Open in OMR Hub',
  description: 'Open this workout in the OMR Hub app',
  other: {
    'apple-itunes-app': 'app-id=6755069825',
  },
};

export default function WorkoutDeepLinkPage({ params }: WorkoutPageProps) {
  const { id } = params;
  return <DeepLinkPage type="workouts" id={id} />;
}
