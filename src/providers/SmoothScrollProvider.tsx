'use client';

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      prevent: (node) =>
        node.classList?.contains('global-chat-scroll') ||
        Boolean(node.closest?.('.global-chat-scroll')),
    });

    lenisRef.current = lenis;

    // Connect Lenis scroll updates to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    const handleResize = () => {
      if (checkIsMobile() && lenisRef.current) {
        gsap.ticker.remove(updateLenis);
        lenisRef.current.destroy();
        lenisRef.current = null;
        document.documentElement.classList.remove('lenis-active');
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      gsap.ticker.remove(updateLenis);
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

