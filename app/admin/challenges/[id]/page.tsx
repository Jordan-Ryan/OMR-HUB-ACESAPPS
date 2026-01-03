'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import TimedChallengeList from '@/components/admin/TimedChallengeList';
import ParticipantList from '@/components/admin/ParticipantList';

interface Challenge {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  image_url?: string | null;
  default_min_steps?: number | null;
  calorie_multiplier?: number | null;
  default_protein_percent?: number | null;
  default_carbs_percent?: number | null;
  default_fat_percent?: number | null;
  weight_measurement_frequency?: string | null;
  physique_frequency?: string | null;
  allow_client_weight_checkin?: boolean;
  allow_client_physique_checkin?: boolean;
  challenge_info?: string | null;
  enrollment_count?: number;
  goals_count?: number;
  community_challenges_count?: number;
}

type Tab = 'overview' | 'participants' | 'pending' | 'timed';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const currentTab = (searchParams.get('tab') as Tab) || 'overview';

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChallenge();
    }
  }, [id]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/challenges/${id}`);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getChallengeStatus = () => {
    if (!challenge) return { label: 'Unknown', color: 'rgba(255, 255, 255, 0.4)' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(challenge.start_at);
    const endDate = new Date(challenge.end_at);
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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Challenge not found</p>
        <Link
          href="/admin/challenges"
          style={{
            display: 'inline-block',
            marginTop: '16px',
            color: '#007AFF',
            textDecoration: 'none',
          }}
        >
          Back to Challenges
        </Link>
      </div>
    );
  }

  const status = getChallengeStatus();

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
              {challenge.title}
            </h1>
            <span
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                background: `${status.color}20`,
                color: status.color,
                border: `1px solid ${status.color}40`,
              }}
            >
              {status.label}
            </span>
          </div>
          {challenge.description && (
            <p style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '15px', marginBottom: '16px' }}>
              {challenge.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)' }}>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Start:</strong> {formatDate(challenge.start_at)}
            </div>
            <div>
              <strong style={{ color: '#FFFFFF' }}>End:</strong> {formatDate(challenge.end_at)}
            </div>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Participants:</strong> {challenge.enrollment_count || 0}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href={`/admin/challenges/${id}/edit`}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '500',
            }}
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'participants', label: `Participants (${challenge.enrollment_count || 0})` },
          { id: 'pending', label: 'Pending' },
          { id: 'timed', label: `Timed Challenges` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(`/admin/challenges/${id}?tab=${tab.id}`)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom:
                currentTab === tab.id
                  ? '2px solid #007AFF'
                  : '2px solid transparent',
              color:
                currentTab === tab.id
                  ? '#FFFFFF'
                  : 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
              fontWeight: currentTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === 'overview' && (
          <div className="card" style={{ padding: '32px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
              Challenge Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div>
                <h3 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                  Default Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)' }}>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Min Steps:</strong>{' '}
                    {challenge.default_min_steps?.toLocaleString() || 'Not set'}
                  </div>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Calorie Multiplier:</strong>{' '}
                    {challenge.calorie_multiplier || 15}
                  </div>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Default Macros:</strong>{' '}
                    {challenge.default_protein_percent && challenge.default_carbs_percent && challenge.default_fat_percent
                      ? `P: ${challenge.default_protein_percent}% C: ${challenge.default_carbs_percent}% F: ${challenge.default_fat_percent}%`
                      : 'Not set'}
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                  Check-in Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)' }}>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Weight Frequency:</strong>{' '}
                    {challenge.weight_measurement_frequency || 'Not set'}
                  </div>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Physique Frequency:</strong>{' '}
                    {challenge.physique_frequency || 'Not set'}
                  </div>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Client Permissions:</strong>{' '}
                    {challenge.allow_client_weight_checkin ? 'Weight ✓' : 'Weight ✗'}{' '}
                    {challenge.allow_client_physique_checkin ? 'Physique ✓' : 'Physique ✗'}
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                  Statistics
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)' }}>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Goals:</strong> {challenge.goals_count || 0}
                  </div>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Timed Challenges:</strong>{' '}
                    {challenge.community_challenges_count || 0}
                  </div>
                </div>
              </div>
            </div>
            {challenge.challenge_info && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                  Challenge Information
                </h3>
                <div
                  style={{
                    color: 'rgba(235, 235, 245, 0.8)',
                    fontSize: '14px',
                    lineHeight: '24px',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkBreaks]}
                    components={{
                      p: ({ children }) => <p style={{ marginBottom: '12px', marginTop: 0 }}>{children}</p>,
                      h1: ({ children }) => <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px', marginTop: '16px' }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '10px', marginTop: '14px' }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px', marginTop: '12px' }}>{children}</h3>,
                      ul: ({ children }) => <ul style={{ marginBottom: '12px', marginTop: '8px', paddingLeft: '24px' }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ marginBottom: '12px', marginTop: '8px', paddingLeft: '24px' }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: '6px' }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ fontWeight: '600', color: '#FFFFFF' }}>{children}</strong>,
                      em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                      code: ({ children }) => (
                        <code style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                        }}>
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote style={{
                          borderLeft: '3px solid rgba(255, 255, 255, 0.2)',
                          paddingLeft: '16px',
                          marginLeft: 0,
                          marginTop: '12px',
                          marginBottom: '12px',
                          color: 'rgba(235, 235, 245, 0.7)',
                        }}>
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {challenge.challenge_info}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'participants' && (
          <div>
            <ParticipantList 
              challengeId={id} 
              challengeStartDate={challenge.start_at}
              challengeEndDate={challenge.end_at}
              statusFilter="onboarded"
            />
          </div>
        )}

        {currentTab === 'pending' && (
          <div>
            <ParticipantList 
              challengeId={id} 
              challengeStartDate={challenge.start_at}
              challengeEndDate={challenge.end_at}
              statusFilter="pending"
            />
          </div>
        )}

        {currentTab === 'timed' && (
          <div>
            <TimedChallengeList challengeId={id} challengeStartDate={challenge.start_at} challengeEndDate={challenge.end_at} />
          </div>
        )}
      </div>
    </div>
  );
}

