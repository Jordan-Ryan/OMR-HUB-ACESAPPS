'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ParticipantList from '@/components/admin/ParticipantList';

interface Challenge {
  id: string;
  start_at: string;
  end_at: string;
}

export default function ChallengeParticipantsPage() {
  const params = useParams();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/challenges/${challengeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch challenge');
      }
      const data = await response.json();
      setChallenge(data.challenge);
    } catch (error) {
      console.error('Error fetching challenge:', error);
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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading challenge...</p>
      </div>
    );
  }

  if (!challenge) {
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
        <p style={{ color: '#FF3B30' }}>Challenge not found.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <ParticipantList 
        challengeId={challengeId}
        challengeStartDate={challenge.start_at}
        challengeEndDate={challenge.end_at}
      />
    </div>
  );
}

