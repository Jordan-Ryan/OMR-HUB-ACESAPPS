'use client';

import Link from 'next/link';
import ChallengeForm from '@/components/admin/ChallengeForm';

export default function CreateChallengePage() {
  return (
    <div>
      <Link
        href="/admin/challenges"
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
        ← Back to Challenges
      </Link>
      <ChallengeForm />
    </div>
  );
}

