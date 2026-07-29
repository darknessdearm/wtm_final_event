import type { Metadata } from 'next';
import { Prompt, VT323 } from 'next/font/google';
import './globals.css';
import { EVENT_TITLE, EVENT_DESCRIPTION } from '@/lib/data';

// Terminal face for Latin text and numerals. Latin-only by design.
const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-vt323',
  display: 'swap',
});

// Thai fallback — VT323 has no Thai glyphs, and item names, injuries and the
// result sentence are all Thai.
const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: EVENT_TITLE,
  description: EVENT_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${vt323.variable} ${prompt.variable}`}>
      <body className="bg-black font-term antialiased">{children}</body>
    </html>
  );
}
