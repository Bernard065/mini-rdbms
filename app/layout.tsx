import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mini RDBMS - TypeScript SQL Database',
  description:
    'A fully typed, in-memory relational database management system with SQL support, built with TypeScript and Next.js',
  keywords: ['rdbms', 'sql', 'typescript', 'database', 'next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
