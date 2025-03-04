'use client';

import { useEffect } from 'react';

import VConsole from 'vconsole';

export default function Debugger() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vconsole = new VConsole();
      return () => vconsole.destroy();
    }
  }, []);

  return null;
}
