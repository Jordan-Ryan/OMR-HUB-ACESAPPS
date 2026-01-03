'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Enrollment {
  id: string;
  user_id: string;
  status: 'pending' | 'onboarded';
  bodyweight_kg: number;
  calculated_calories: number;
  fitness_level: string;
  enrolled_at: string;
  start_date?: string | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
  };
}

export default function ParticipantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;
  const userId = params.userId as string;

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId && userId) {
      fetchEnrollment();
    }
  }, [challengeId, userId]);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      // First get all enrollments for this challenge
      const response = await fetch(`/api/admin/challenges/${challengeId}/enrollments`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      const data = await response.json();
      const userEnrollment = data.enrollments?.find((e: any) => e.user_id === userId);
      if (userEnrollment) {
        // Fetch full enrollment details
        const detailResponse = await fetch(
          `/api/admin/challenges/${challengeId}/enrollments/${userEnrollment.id}`
        );
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          setEnrollment(detailData.enrollment);
        }
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user?: Enrollment['user']) => {
    if (!user) return 'Unknown User';
    if (user.nickname) return user.nickname;
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Unknown User';
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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Loading participant details...</p>
      </div>
    );
  }

  if (!enrollment) {
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
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>Participant not found</p>
        <Link
          href={`/admin/challenges/${challengeId}/participants`}
          style={{
            display: 'inline-block',
            marginTop: '16px',
            color: '#007AFF',
            textDecoration: 'none',
          }}
        >
          Back to Participants
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href={`/admin/challenges/${challengeId}/participants`}
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#007AFF',
            textDecoration: 'none',
            fontSize: '15px',
          }}
        >
          ← Back to Participants
        </Link>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
          {getUserName(enrollment.user)}
        </h1>
      </div>

      <div className="card" style={{ padding: '32px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600', color: '#FFFFFF' }}>
          Enrollment Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Status</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Bodyweight</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {enrollment.bodyweight_kg} kg
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Calculated Calories</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {enrollment.calculated_calories} kcal
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'rgba(235, 235, 245, 0.6)', marginBottom: '4px' }}>Fitness Level</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
              {enrollment.fitness_level.charAt(0).toUpperCase() + enrollment.fitness_level.slice(1)}
            </div>
          </div>
        </div>
        <p style={{ marginTop: '24px', color: 'rgba(235, 235, 245, 0.6)', fontSize: '14px' }}>
          Full participant tracking with check-ins, progress charts, and community challenge participation will be available here.
        </p>
      </div>
    </div>
  );
}

