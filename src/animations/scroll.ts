import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollReveals() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;

  // Reveal sections with clean, GPU-accelerated opacity & y-axis motion (no heavy CSS blurs)
  const revealElements = document.querySelectorAll<HTMLElement>(
    '[data-scroll-section], .bento-card, .glass-card, .glass-panel, .podium-card, .section-title, .grid-responsive > div'
  );

  revealElements.forEach((el) => {
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: isMobile ? 20 : 35,
        scale: isMobile ? 1 : 0.98,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: isMobile ? 0.45 : 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: isMobile ? 'top 94%' : 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // Skip continuous parallax calculations on mobile to save CPU/battery
  if (!isMobile) {
    const glows = document.querySelectorAll<HTMLElement>('.hero-glow, .ambient-glow-cyan, .ambient-glow-violet');
    glows.forEach((glow) => {
      gsap.to(glow, {
        y: -40,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: glow.parentElement || document.body,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      });
    });
  }
}

