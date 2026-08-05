import gsap from 'gsap';

export interface HeroAnimationRefs {
  heroRef: HTMLElement | null;
  videoRef: HTMLElement | null;
  overlayRef: HTMLElement | null;
  badgeRef: HTMLElement | null;
  headlineRef: HTMLElement | null;
  subtitleRef: HTMLElement | null;
  ctaRef: HTMLElement | null;
  scrollIndicatorRef: HTMLElement | null;
}

export function initHeroTimeline({
  heroRef,
  videoRef,
  overlayRef,
  badgeRef,
  headlineRef,
  subtitleRef,
  ctaRef,
  scrollIndicatorRef
}: HeroAnimationRefs) {
  if (!heroRef) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // 0.0s - Video fades from black
  if (videoRef) {
    tl.fromTo(videoRef, { opacity: 0, scale: 1.05 }, { opacity: 0.35, scale: 1, duration: 1.2 }, 0);
  }

  // 0.4s - Dark overlay appears
  if (overlayRef) {
    tl.fromTo(overlayRef, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.4);
  }

  // 0.8s - Badge reveal
  if (badgeRef) {
    tl.fromTo(badgeRef, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.8);
  }

  // 1.0s - Headline reveals line by line
  if (headlineRef) {
    tl.fromTo(headlineRef, { opacity: 0, y: 40, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, 1.0);
  }

  // 1.4s - Subtitle fades upward
  if (subtitleRef) {
    tl.fromTo(subtitleRef, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 1.4);
  }

  // 1.8s - CTA buttons appear with stagger
  if (ctaRef) {
    const buttons = ctaRef.querySelectorAll('a, button');
    if (buttons.length > 0) {
      tl.fromTo(buttons, { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15 }, 1.8);
    }
  }

  // 2.2s - Scroll indicator begins floating animation
  if (scrollIndicatorRef) {
    tl.fromTo(scrollIndicatorRef, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, 2.2);

    // Continuous floating bounce loop
    gsap.to(scrollIndicatorRef, {
      y: 8,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  return tl;
}
