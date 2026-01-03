'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChallengeForm from '@/components/admin/ChallengeForm';

export default function EditChallengePage() {
  const params = useParams();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChallenge();
    }
  }, [id]);

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch challenge');
      }
      const data = await response.json();
      setInitialData(data.challenge);
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

  return <ChallengeForm challengeId={id} initialData={initialData} />;
}

