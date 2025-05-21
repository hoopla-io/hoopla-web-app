'use client';

import { Settings2 } from 'lucide-react';
import { useEffect } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '../ui/button';

import useTelegramApp from '@/hooks/useTelegramApp';

// import DebuggerToggle from '@/components/func/Debugger';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { close } = useTelegramApp();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      if (pathname === '/') {
        window.Telegram.WebApp.BackButton.hide();
      } else {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => router.back());
      }
    }
  }, [pathname, router, close]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-background shadow-md z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-2 font-eugusto text-2xl text-primary">
            hoopla
          </Link>
          <Button className="flex items-center space-x-4">
            <Link href="/subscriptions" className="text-white transition-colors  p-2 font-bold">
              Subscriptions
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
