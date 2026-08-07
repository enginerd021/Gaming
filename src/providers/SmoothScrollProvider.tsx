'use client';

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Helper to check if screen is mobile or touch device
    const checkIsMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.innerWidth < 768;
      return isSmallScreen || (isTouch && isCoarse);
    };

    // If reduced motion is requested or user is on mobile/touch, use native hardware-accelerated smooth scrolling
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || checkIsMobile()) {
      document.documentElement.classList.remove('lenis-active');
      return;
    }

    document.documentElement.classList.add('lenis-active');

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      prevent: (node) =>
        node.classList?.contains('global-chat-scroll') ||
        Boolean(node.closest?.('.global-chat-scroll')),
    });

    lenisRef.current = lenis;

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    const handleResize = () => {
      if (checkIsMobile() && lenisRef.current) {
        cancelAnimationFrame(animationFrameId);
        lenisRef.current.destroy();
        lenisRef.current = null;
        document.documentElement.classList.remove('lenis-active');
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      document.documentElement.classList.remove('lenis-active');
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScrollProvider;

