import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';

// Tools written as one sentence; each name lights up as you scroll down it
export default function Tools({ data }) {
  const ref = useRef(null);
  const items = data.items || [];
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.tool', { opacity: 0.18, y: 18 }, {
        opacity: 1, y: 0, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.tools-line', start: 'top 85%', end: 'bottom 50%', scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [items.length]);
  return (
    <section className="tools" ref={ref}>
      <p className="tools-label">{data.label}</p>
      <p className="tools-line">
        {items.map((t, i) => (
          <span key={i}>
            <span className="tool">{t}{i < items.length - 2 ? ',' : i === items.length - 1 ? '.' : ''}</span>
            {i === items.length - 2 ? ' and ' : ' '}
          </span>
        ))}
      </p>
    </section>
  );
}
