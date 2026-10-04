import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger, prefersReducedMotion, scrollToTop } from '../lib/motion';
import { runScrollFX } from '../lib/scrollfx';
import { useContent } from '../lib/ContentContext';

// A lilac panel sweeps off the screen each time the page changes
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const panel = useRef(null);
  const first = useRef(true);
  const page = useRef(null);
  const { content } = useContent();

  useLayoutEffect(() => {
    const undo = runScrollFX(page.current);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return undo;
  }, [pathname, content]);

  useLayoutEffect(() => {
    scrollToTop();
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (first.current) { first.current = false; return; }
    if (prefersReducedMotion()) return;
    gsap.fromTo(panel.current,
      { yPercent: 0, display: 'block' },
      { yPercent: -100, duration: 0.85, ease: 'power4.inOut', onComplete: () => gsap.set(panel.current, { display: 'none' }) });
  }, [pathname]);

  return (
    <>
      <div className="wipe" ref={panel} aria-hidden="true" />
      <div key={pathname} ref={page}>{children}</div>
    </>
  );
}
