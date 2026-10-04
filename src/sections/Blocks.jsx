import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useContent } from '../lib/ContentContext';
import SplitHeading from '../components/SplitHeading';
import { MagneticButton } from '../components/SmartLink';

// Big closing call to action: the lilac panel grows out of a circle as it scrolls in
export function CTA({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.cta-panel', { clipPath: 'circle(8% at 50% 60%)' }, {
        clipPath: 'circle(75% at 50% 50%)', ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'top 25%', scrub: true },
      });
      gsap.fromTo('.cta-heading', { scale: 0.7, rotate: -4 }, {
        scale: 1, rotate: 0, ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'top 20%', scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section className="cta" ref={ref}>
      <div className="cta-panel">
        <SplitHeading text={data.heading} className="cta-heading" />
        {data.body && <p className="lede" data-fx="rise">{data.body}</p>}
        {data.button?.label && <MagneticButton to={data.button.path} variant="dark">{data.button.label}</MagneticButton>}
      </div>
    </section>
  );
}

// Paragraph that "reads itself": words go from faint to solid as you scroll
export function TextBlock({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.read-w', { opacity: 0.16 }, {
        opacity: 1, stagger: 0.05, ease: 'none',
        scrollTrigger: { trigger: '.read', start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [data.body]);
  return (
    <section className="section text-block" ref={ref}>
      <div data-fx="drift"><SplitHeading text={data.heading} /></div>
      <p className="read">
        {(data.body || '').split(' ').map((w, i) => <span className="read-w" key={i}>{w} </span>)}
      </p>
    </section>
  );
}

export function PageHeader({ data }) {
  return (
    <header className="page-header">
      <div data-fx="title-out"><SplitHeading as="h1" text={data.heading} className="page-title" /></div>
      {data.body && <p className="lede" data-fx="rise">{data.body}</p>}
    </header>
  );
}

export function AboutIntro({ data }) {
  const ref = useRef(null);
  const { content } = useContent();
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.portrait-inner', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.portrait', { clipPath: 'inset(100% 0 0 0 round var(--radius))', duration: 1.3, ease: 'power4.inOut', delay: 0.2 });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section className="about-intro" ref={ref}>
      <div className="about-copy">
        <div data-fx="title-out"><SplitHeading as="h1" text={data.heading} className="page-title" /></div>
        <p className="lede" data-fx="rise">{data.body}</p>
      </div>
      <figure className="portrait" data-fx="parallax" data-speed="0.08">
        <div className="portrait-inner">
          {data.photoUrl
            ? <img src={data.photoUrl} alt={data.photoAlt || ''} />
            : <span className="portrait-placeholder" aria-label="Photo coming soon">{content.site.name.slice(0, 1)}</span>}
        </div>
      </figure>
    </section>
  );
}

export function Skills({ data }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.skill-group').forEach((g) =>
        gsap.from(g.querySelectorAll('.chips li'), { scale: 0.6, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(2)', scrollTrigger: { trigger: g, start: 'top 85%' } }));
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section className="section" ref={ref}>
      <div className="section-head" data-skew><SplitHeading text={data.heading} /></div>
      <div className="skill-groups">
        {(data.groups || []).map((g) => (
          <div className="skill-group" data-fx="rise" key={g.title}>
            <h3>{g.title}</h3>
            <ul className="chips">{(g.items || []).map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FAQ({ data }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="section">
      <div className="section-head" data-skew><SplitHeading text={data.heading} /></div>
      <div className="faq" data-fx="stagger">
        {(data.items || []).map((f, i) => (
          <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={i}>
            <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span><i aria-hidden="true" />
            </button>
            <div className="faq-a"><div><p>{f.a}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  );
}
