
import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import type React from 'react';

const roboto = Roboto({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'IPO Mad Racing',
  description: 'An exciting platformer game by Firebase Studio',
  manifest: '/manifest.json', 
  icons: '/favicon.ico', // Simplified for debugging
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // viewportFit: 'cover', // Simplified for debugging
  // interactiveWidget: 'resizes-content', // Simplified for debugging
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Favicon and manifest are now primarily handled by metadata and viewport exports */}
      </head>
      <body className={`${roboto.variable} font-sans antialiased h-full dark`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

