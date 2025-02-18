'use client';

import { Home, User, QrCode } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      <nav className="max-w-4xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between relative">
          <Link
            href="/"
            className={`flex flex-col items-center p-2 ${
              pathname === '/' ? 'text-primary' : 'text-text'
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 -top-12">
            <Link
              href="/qr"
              className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-primary shadow-lg"
            >
              <QrCode size={30} className="text-background" />
            </Link>
          </div>

          <Link
            href="/profile"
            className={`flex flex-col items-center p-2 ${
              pathname === '/profile' ? 'text-primary' : 'text-text'
            }`}
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
