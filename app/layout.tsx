import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Notion-like Landing Page',
  description: 'A static landing page generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
