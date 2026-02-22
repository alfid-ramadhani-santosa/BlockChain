import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Block Blast Solver - AI Powered',
  description: 'Solve Block Blast puzzles instantly with AI. Upload a screenshot or input manually.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
