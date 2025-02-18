'use client';

import type React from 'react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';

import AuthModal from '@/components/func/AuthModal';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuth(true);
    } else {
      setShowAuth(false);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAuthenticated ? children : null}
      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          setShowAuth(false);
        }}
        onSuccess={() => setShowAuth(false)}
      />
    </>
  );
}
