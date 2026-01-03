'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TimedChallengeForm from '@/components/admin/CommunityChallengeForm';

export default function EditTimedChallengePage() {
  const params = useParams();
  const challengeId = params.id as string;
  const timedChallengeId = params.communityId as string;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId && timedChallengeId) {
      fetchChallenge();
    }
  }, [challengeId, timedChallengeId]);

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}/timed-api/${timedChallengeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timed challenge');
      }
      const data = await response.json();
      setInitialData(data.challenge);
    } catch (error) {
      console.error('Error fetching timed challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: '48px',
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading timed challenge...</p>
      </div>
    );
  }

  return (
    <TimedChallengeForm
      challengeId={challengeId}
      timedChallengeId={timedChallengeId}
      initialData={initialData}
    />
  );
}

