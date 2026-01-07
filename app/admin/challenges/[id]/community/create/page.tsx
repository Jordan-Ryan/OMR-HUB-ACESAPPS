'use client';

import { useParams } from 'next/navigation';
import TimedChallengeForm from '@/components/admin/CommunityChallengeForm';

export default function CreateTimedChallengePage() {
  const params = useParams();
  const challengeId = params.id as string;

  return <TimedChallengeForm challengeId={challengeId} />;
}

