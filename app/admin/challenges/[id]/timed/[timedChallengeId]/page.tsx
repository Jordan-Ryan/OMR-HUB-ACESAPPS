'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TimedChallenge {
  id: string;
  title: string;
  description?: string | null;
  challenge_type: string;
  start_date: string;
  end_date: string;
  submission_count?: number;
}

interface Submission {
  id: string;
  user_id: string;
  time?: number | null;
  distance?: number | null;
  weight?: number | null;
  reps_or_rounds?: number | null;
  calories?: number | null;
  submitted_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    nickname?: string | null;
    avatar_url?: string | null;
  };
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

export default function TimedChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const timedChallengeId = params.timedChallengeId as string;

  const [challenge, setChallenge] = useState<TimedChallenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId && timedChallengeId) {
      fetchChallenge();
      fetchSubmissions();
    }
  }, [challengeId, timedChallengeId]);

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}/timed/${timedChallengeId}`);
      if (!response.ok) throw new Error('Failed to fetch timed challenge');
      const data = await response.json();
      setChallenge(data.challenge);
    } catch (error) {
      console.error('Error fetching timed challenge:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}/timed/${timedChallengeId}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (seconds: number | null | undefined) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    if (mins > 0) {
      return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
    return `${secs}.${String(ms).padStart(2, '0')}s`;
  };

  const getChallengeStatus = () => {
    if (!challenge) return { label: 'Unknown', color: 'rgba(255, 255, 255, 0.4)' };
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

  const getSortedSubmissions = () => {
    if (!challenge) return [];
    
    const sorted = [...submissions];
    switch (challenge.challenge_type) {
      case 'for_time':
        // Sort by time ascending (fastest first)
        return sorted.sort((a, b) => {
          const timeA = a.time || Infinity;
          const timeB = b.time || Infinity;
          return timeA - timeB;
        });
      case 'for_distance':
      case 'strength':
      case 'max_reps':
      case 'max_rounds':
      case 'calories':
      case 'steps':
        // Sort by value descending (highest first)
        return sorted.sort((a, b) => {
          const valueA = a.distance || a.weight || a.reps_or_rounds || a.calories || 0;
          const valueB = b.distance || b.weight || b.reps_or_rounds || b.calories || 0;
          return valueB - valueA;
        });
      default:
        return sorted;
    }
  };

  const getUserDisplayName = (user: Submission['user']) => {
    if (!user) return 'Unknown';
    return user.nickname || `${user.first_name} ${user.last_name}`;
  };

  const getSubmissionValue = (submission: Submission) => {
    if (challenge?.challenge_type === 'for_time' && submission.time) {
      return formatTime(submission.time);
    }
    if (challenge?.challenge_type === 'for_distance' && submission.distance) {
      return `${submission.distance}km`;
    }
    if (challenge?.challenge_type === 'strength' && submission.weight) {
      return `${submission.weight}kg`;
    }
    if ((challenge?.challenge_type === 'max_reps' || challenge?.challenge_type === 'max_rounds') && submission.reps_or_rounds) {
      return `${submission.reps_or_rounds}`;
    }
    if (challenge?.challenge_type === 'calories' && submission.calories) {
      return `${submission.calories}`;
    }
    if (challenge?.challenge_type === 'steps' && submission.calories) {
      return `${submission.calories}`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading timed challenge...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: '#FF3B30' }}>Timed challenge not found.</p>
        <Link href={`/admin/challenges/${challengeId}?tab=timed`} style={{ color: '#007AFF', marginTop: '16px', display: 'inline-block' }}>
          Back to Timed Challenges
        </Link>
      </div>
    );
  }

  const status = getChallengeStatus();
  const sortedSubmissions = getSortedSubmissions();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href={`/admin/challenges/${challengeId}?tab=timed`}
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
          ← Back
        </Link>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
          {challenge.title}
        </h1>
      </div>

      {/* Challenge Details */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
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
              padding: '6px 12px',
              borderRadius: '8px',
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
          <p style={{ color: 'rgba(235, 235, 245, 0.8)', fontSize: '15px', lineHeight: '24px', marginBottom: '16px' }}>
            {challenge.description}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
          <div>
            <strong style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: '4px' }}>Start Date</strong>
            <span style={{ color: '#FFFFFF' }}>{formatDate(challenge.start_date)}</span>
          </div>
          <div>
            <strong style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: '4px' }}>End Date</strong>
            <span style={{ color: '#FFFFFF' }}>{formatDate(challenge.end_date)}</span>
          </div>
          <div>
            <strong style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: '4px' }}>Submissions</strong>
            <span style={{ color: '#FFFFFF' }}>{submissions.length}</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card" style={{ padding: '32px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
          Leaderboard
        </h2>

        {sortedSubmissions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No submissions yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedSubmissions.map((submission, index) => (
              <div
                key={submission.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: index < 3 ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  borderRadius: '12px',
                  border: index < 3 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: index < 3 ? '#000000' : '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>
                {submission.user?.avatar_url ? (
                  <img
                    src={submission.user.avatar_url}
                    alt={getUserDisplayName(submission.user)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
                    {getUserDisplayName(submission.user).charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>
                    {getUserDisplayName(submission.user)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(235, 235, 245, 0.6)' }}>
                    {formatDate(submission.submitted_at)}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                  {getSubmissionValue(submission)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

