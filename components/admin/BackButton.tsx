'use client';

import Link from 'next/link';

interface BackButtonProps {
  href: string;
  label: string;
}

export default function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link
      href={href}
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
      ← {label}
    </Link>
  );
}

