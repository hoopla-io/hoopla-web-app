import type React from 'react';

import ProtectedRoute from '@/components/func/ProtectedRoute';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
