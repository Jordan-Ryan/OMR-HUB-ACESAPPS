'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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

  return (
    <div>
      <Link
        href={`/admin/challenges/${id}`}
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
        ← Back to Challenge
      </Link>
      <ChallengeForm challengeId={id} initialData={initialData} />
    </div>
  );
}



