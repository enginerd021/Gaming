'use client';

import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`page-transition-wrapper ${mounted ? 'is-mounted' : ''}`}>
      {children}
    </div>
  );
}
