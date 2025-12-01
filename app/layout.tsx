import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'OMR Hub',
  description: 'Deep link and info site for the OMR Hub app.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}