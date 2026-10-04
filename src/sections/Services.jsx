import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useContent } from '../lib/ContentContext';
import SplitHeading from '../components/SplitHeading';
import { SmartLink } from '../components/SmartLink';

function useRowReveal(ref, dep) {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.svc-row').forEach((row) => {
        gsap.from(row.querySelector('.svc-rule'), { scaleX: 0, transformOrigin: 'left', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: row, start: 'top 90%' } });
        gsap.from(row.querySelectorAll('.svc-anim'), { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 88%' } });
      });
    }, ref);
    return () => ctx.revert();
  }, [dep]);
}

function Row({ s, i, detailed }) {
  return (
    <li className="svc-row">
      <span className="svc-rule" aria-hidden="true" />
      <div className="svc-head" data-fx="drift">
        <span className="svc-num svc-anim">{String(i + 1).padStart(2, '0')}</span>
        <h3 className="svc-anim">{s.title}</h3>
      </div>
      <div className="svc-body svc-anim">
        <p>{s.text}</p>
        {detailed && s.examples?.length > 0 && (
          <ul className="chips">{s.examples.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
      </div>
    </li>
  );
}

export function ServicesSnapshot({ data }) {
  const { content } = useContent();
  const ref = useRef(null);
  const list = content.services.slice(0, data.limit || 4);
  useRowReveal(ref, list.length);
  return (
    <section className="section" ref={ref}>
      <div className="section-head" data-skew>
        <SplitHeading text={data.heading} />
        {data.linkLabel && <SmartLink to="/services" className="text-link">{data.linkLabel}</SmartLink>}
      </div>
      <ol className="svc-list">{list.map((s, i) => <Row key={s.title} s={s} i={i} />)}</ol>
    </section>
  );
}

export function ServiceList() {
  const { content } = useContent();
  const ref = useRef(null);
  useRowReveal(ref, content.services.length);
  return (
    <section className="section section-tight" ref={ref}>
      <ol className="svc-list">{content.services.map((s, i) => <Row key={s.title} s={s} i={i} detailed />)}</ol>
    </section>
  );
}
