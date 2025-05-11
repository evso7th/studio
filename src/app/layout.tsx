import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
// import { GeistSans } from 'geist/font/sans'; // Removed due to "Module not found" error
// import { GeistMono } from 'geist/font/mono'; // Removed due to "Module not found" error
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import type React from 'react';

const roboto = Roboto({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-roboto',
});

// Removed GeistSans and GeistMono due to "Module not found" errors.
// const geistSans = GeistSans;
// const geistMono = GeistMono;


export const metadata: Metadata = {
  title: 'IPO Mad Racing',
  description: 'An exciting platformer game by Firebase Studio',
  // Removed explicit icons configuration to rely on Next.js default behavior
  // Ensure src/app/favicon.ico exists
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${roboto.variable} font-sans antialiased h-full dark`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
