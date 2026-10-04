import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import SplitHeading from '../components/SplitHeading';

// The roles Sharon has held, scrolled sideways while the section is pinned
export default function Hats({ data }) {
  const root = useRef(null);
  const track = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const distance = () => track.current.scrollWidth - root.current.querySelector('.hats-viewport').clientWidth;
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
    });
    mm.add('(max-width: 899px)', () => {
      gsap.utils.toArray(root.current.querySelectorAll('.hat')).forEach((h) =>
        gsap.from(h, { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));
    });
    return () => mm.revert();
  }, [data.items?.length]);
  const items = data.items || [];
  return (
    <section className="hats" ref={root}>
      <div className="hats-intro">
        <SplitHeading text={data.heading} />
        {data.body && <p className="lede" data-fx="rise">{data.body}</p>}
      </div>
      <div className="hats-viewport">
        <ol className="hats-track" ref={track}>
          {items.map((h, i) => (
            <li className={`hat ${i === items.length - 1 ? 'hat-now' : ''}`} key={i}>
              <h3>{h.title}</h3>
              <p>{h.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
