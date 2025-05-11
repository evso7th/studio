
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
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: 'any' }, // More explicit
    ],
    // For completeness, browsers often look for these as well.
    // If you have these files in /public, uncomment them.
    // apple: '/apple-touch-icon.png',
    // shortcut: '/favicon.ico',
  },
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

