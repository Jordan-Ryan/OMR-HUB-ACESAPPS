import type { ReactNode } from 'react';
import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'OMR Hub',
  description: 'OMR Hub - Your hub for activities, events, and workouts.',
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