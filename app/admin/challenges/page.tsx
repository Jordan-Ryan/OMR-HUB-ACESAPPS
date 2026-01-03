'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';

export default function ChallengesPage() {
  const params = useParams();
  const challengeId = params.id;

  // If we're on a specific challenge page, show the detail view
  // Otherwise, show a welcome/empty state since challenges are in the sidebar
  if (challengeId) {
    return null; // Challenge detail will be handled by [id]/page.tsx
  }

  return (
    <div>
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
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
          Challenges
        </h2>
        <p style={{ color: 'rgba(235, 235, 245, 0.6)', fontSize: '15px' }}>
          Select a challenge from the sidebar to view details, or create a new challenge.
        </p>
      </div>
    </div>
  );
}

