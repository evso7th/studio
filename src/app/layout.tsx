import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
// import { GeistSans } from 'geist/font/sans'; // Removed due to "Module not found" error
// import { GeistMono } from 'geist/font/mono'; // Removed due to "Module not found" error
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'IPO Mad Racing',
  description: 'An exciting platformer game by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${roboto.variable} font-sans antialiased h-full dark`}>
        {/* Removed GeistSans.variable and GeistMono.variable from className to resolve build error */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
