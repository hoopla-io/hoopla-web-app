import type React from 'react';
import { Toaster } from 'react-hot-toast';

import { Inter } from 'next/font/google';
import Script from 'next/script';

import '@/app/globals.css';
import Providers from '@/app/providers';

import BottomNav from '@/components/func/BottomNav';
import Header from '@/components/func/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Coffee Subscription App',
  description: 'Get your daily coffee fix with ease',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <html lang="en">
        <head>
          <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        </head>
        <body className={`${inter.className}`}>
          <Header />
          <Toaster />

          <main className="flex-grow overflow-y-auto mb-24 mt-[56px] max-w-2xl mx-auto">
            {children}
          </main>
          <BottomNav />
        </body>
      </html>
    </Providers>
  );
}
