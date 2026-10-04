import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import SplitHeading from '../components/SplitHeading';

// A line fills as you scroll; each step lights up when the line reaches it.
function StepLine({ heading, items = [], variant }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      ref.current.querySelectorAll('.step').forEach((s) => s.classList.add('is-on'));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo('.steps-fill', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.steps', start: 'top 60%', end: 'bottom 60%', scrub: true },
      });
      gsap.utils.toArray('.step').forEach((s) => {
        gsap.from(s.querySelector('.step-body'), { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 75%' } });
        gsap.to(s, { scrollTrigger: { trigger: s, start: 'top 60%', toggleClass: 'is-on' } });
      });
    }, ref);
    return () => ctx.revert();
  }, [items.length]);
  return (
    <section className={`section steps-section steps-${variant}`} ref={ref}>
      <div className="section-head" data-skew><SplitHeading text={heading} /></div>
      <ol className="steps">
        <span className="steps-track" aria-hidden="true"><span className="steps-fill" /></span>
        {items.map((s, i) => (
          <li className="step" key={i}>
            <span className="step-dot" aria-hidden="true">{i + 1}</span>
            <div className="step-body">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const Process = ({ data }) => <StepLine heading={data.heading} items={data.steps} variant="process" />;
export const Timeline = ({ data }) => <StepLine heading={data.heading} items={data.items} variant="timeline" />;
