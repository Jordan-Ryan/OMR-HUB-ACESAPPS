'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CommunityChallenge {
  id: string;
  title: string;
  description?: string | null;
  challenge_type: string;
  start_date: string;
  end_date: string;
  submission_count?: number;
}

interface CommunityChallengeListProps {
  challengeId: string;
}

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  for_time: 'For Time',
  for_distance: 'For Distance',
  strength: 'Strength',
  max_reps: 'Max Reps',
  max_rounds: 'Max Rounds',
  calories: 'Calories',
  steps: 'Steps',
};

export default function CommunityChallengeList({ challengeId }: CommunityChallengeListProps) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [challengeId]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/challenges/${challengeId}/community`);

      if (!response.ok) {
        throw new Error('Failed to fetch community challenges');
      }

      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching community challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getChallengeStatus = (challenge: CommunityChallenge) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > today) {
      return { label: 'Upcoming', color: '#007AFF' };
    } else if (endDate < today) {
      return { label: 'Past', color: 'rgba(255, 255, 255, 0.4)' };
    } else {
      return { label: 'Active', color: '#34C759' };
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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading community challenges...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
          Community Challenges
        </h2>
        <Link
          href={`/admin/challenges/${challengeId}/community/create`}
          style={{
            padding: '12px 24px',
            background: '#007AFF',
            borderRadius: '10px',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          Create Community Challenge
        </Link>
      </div>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>
            No community challenges found. Create one to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge);
            return (
              <div
                key={challenge.id}
                className="card"
                style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '20px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px',
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#FFFFFF',
                        }}
                      >
                        {challenge.title}
                      </h3>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: `${status.color}20`,
                          color: status.color,
                          border: `1px solid ${status.color}40`,
                        }}
                      >
                        {status.label}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                        }}
                      >
                        {CHALLENGE_TYPE_LABELS[challenge.challenge_type] || challenge.challenge_type}
                      </span>
                    </div>
                    {challenge.description && (
                      <p
                        style={{
                          color: 'rgba(235, 235, 245, 0.6)',
                          fontSize: '15px',
                          marginBottom: '12px',
                          lineHeight: '20px',
                        }}
                      >
                        {challenge.description}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'rgba(235, 235, 245, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Start:</strong>{' '}
                        {formatDate(challenge.start_date)}
                      </div>
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>End:</strong>{' '}
                        {formatDate(challenge.end_date)}
                      </div>
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Submissions:</strong>{' '}
                        {challenge.submission_count || 0}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/admin/challenges/${challengeId}/community/${challenge.id}/edit`}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

