import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';

// Heading whose words rise into place when it scrolls into view
export default function SplitHeading({ as: Tag = 'h2', text = '', className = '' }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current.querySelectorAll('.w > span'), {
        yPercent: 115,
        rotate: 4,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.04,
        scrollTrigger: { trigger: ref.current, start: 'top 88%' },
      });
    }, ref);
    return () => ctx.revert();
  }, [text]);
  return (
    <Tag ref={ref} className={`split ${className}`} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <span key={i}>
          <span className="w" aria-hidden="true"><span>{word}</span></span>{' '}
        </span>
      ))}
    </Tag>
  );
}
