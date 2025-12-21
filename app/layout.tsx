import type { ReactNode } from 'react';
import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'OMR‑HUB',
  description:
    'OMR‑HUB is the home for training: workouts, events, and activity tracking — expanding into coach communities and individual training spaces.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
