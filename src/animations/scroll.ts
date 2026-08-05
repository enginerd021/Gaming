import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollReveals() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Reveal sections with smooth 3D fade, scale, and blur
  const revealElements = document.querySelectorAll<HTMLElement>(
    '[data-scroll-section], .bento-card, .glass-card, .glass-panel, .podium-card, .section-title, .grid-responsive > div'
  );

  revealElements.forEach((el, index) => {
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 45,
        scale: 0.95,
        rotateX: -6,
        transformPerspective: 1000,
        filter: 'blur(8px)'
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'bottom 15%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  });

  // Parallax subtle floating effect for ambient background glows
  const glows = document.querySelectorAll<HTMLElement>('.hero-glow, .ambient-glow-cyan, .ambient-glow-violet');
  glows.forEach((glow) => {
    gsap.to(glow, {
      y: -60,
      scale: 1.15,
      ease: 'none',
      scrollTrigger: {
        trigger: glow.parentElement || document.body,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      }
    });
  });
}
