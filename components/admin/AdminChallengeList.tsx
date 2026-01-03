'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchInput from './SearchInput';

interface Challenge {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  enrollment_count?: number;
  onboarded_count?: number;
  pending_count?: number;
}

interface AdminChallengeListProps {
  showCreateButton?: boolean;
}

export default function AdminChallengeList({ showCreateButton = false }: AdminChallengeListProps) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'active' | 'past'>('all');

  useEffect(() => {
    fetchChallenges();
  }, [statusFilter]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const url = statusFilter !== 'all' 
        ? `/api/admin/challenges?status=${statusFilter}`
        : '/api/admin/challenges';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
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

  const getChallengeStatus = (challenge: Challenge) => {
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

  const filteredChallenges = challenges.filter((challenge) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      challenge.title?.toLowerCase().includes(searchLower) ||
      challenge.description?.toLowerCase().includes(searchLower)
    );
  });

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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading challenges...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ flex: 1 }}>
          <SearchInput
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={setSearchTerm}
            style={{ maxWidth: '500px' }}
          />
        </div>
        {showCreateButton && (
          <Link
            href="/admin/challenges/create"
            style={{
              background: '#007AFF',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0051D5';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#007AFF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Create Challenge
          </Link>
        )}
      </div>

      {/* Status Filter */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#1a1a1a',
          padding: '4px',
          borderRadius: '10px',
          width: 'fit-content',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {(['all', 'upcoming', 'active', 'past'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: statusFilter === status ? '#007AFF' : 'transparent',
              color: statusFilter === status ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'capitalize',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      {filteredChallenges.length === 0 ? (
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
            {searchTerm
              ? 'No challenges found matching your search.'
              : 'No challenges found.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredChallenges.map((challenge) => {
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
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/admin/challenges/${challenge.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
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
                          {formatDate(challenge.start_at)}
                        </div>
                        <div>
                          <strong style={{ color: '#FFFFFF' }}>End:</strong>{' '}
                          {formatDate(challenge.end_at)}
                        </div>
                        <div>
                          <strong style={{ color: '#FFFFFF' }}>Participants:</strong>{' '}
                          {challenge.enrollment_count || 0} total
                          {challenge.onboarded_count !== undefined &&
                            challenge.pending_count !== undefined && (
                              <>
                                {' '}
                                ({challenge.onboarded_count} onboarded,{' '}
                                {challenge.pending_count} pending)
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results Count */}
          <div
            style={{
              marginTop: '24px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              padding: '12px 20px',
              background: '#1a1a1a',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'inline-block',
            }}
          >
            Showing <strong style={{ color: '#FFFFFF' }}>{filteredChallenges.length}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{challenges.length}</strong> challenges
          </div>
        </>
      )}
    </div>
  );
}

