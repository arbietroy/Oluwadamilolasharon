import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { MagneticButton } from '../components/SmartLink';

// Positions are percentages of the stage area.
const SCATTER_DESKTOP = [
  { x: 14, y: 22, r: -9 }, { x: 74, y: 12, r: 7 }, { x: 42, y: 52, r: -4 },
  { x: 86, y: 62, r: 10 }, { x: 18, y: 80, r: 6 }, { x: 58, y: 84, r: -11 },
];
const SCATTER_MOBILE = [
  { x: 30, y: 8, r: -8 }, { x: 70, y: 22, r: 7 }, { x: 32, y: 40, r: -5 },
  { x: 68, y: 56, r: 9 }, { x: 30, y: 72, r: 6 }, { x: 66, y: 90, r: -10 },
];
const flowDesktop = (n) => Array.from({ length: n }, (_, i) => ({ x: 9 + i * (82 / Math.max(n - 1, 1)), y: i % 2 ? 62 : 36 }));
const flowMobile = (n) => Array.from({ length: n }, (_, i) => ({ x: i % 2 ? 70 : 30, y: 8 + i * (84 / Math.max(n - 1, 1)) }));

const curve = (a, b, vertical) =>
  vertical
    ? `M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`
    : `M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`;

export default function Hero({ data }) {
  const root = useRef(null);
  const tasks = (data.tasks || []).slice(0, 6);

  useLayoutEffect(() => {
    const el = root.current;
    const mm = gsap.matchMedia();
    const q = gsap.utils.selector(el);

    mm.add({ desktop: '(min-width: 760px)', mobile: '(max-width: 759px)' }, (ctx) => {
      const desktop = ctx.conditions.desktop;
      const scatter = desktop ? SCATTER_DESKTOP : SCATTER_MOBILE;
      const flow = desktop ? flowDesktop(tasks.length) : flowMobile(tasks.length);
      const cards = q('.task');
      const lines = q('.wire');
      const lits = q('.task-lit');

      // draw the wires for this layout, in real pixels so the line-drawing effect is exact
      const svg = q('.wires')[0];
      const stage = q('.hero-stage')[0];
      const drawWires = () => {
        const w = stage.offsetWidth, h = stage.offsetHeight;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const px = (pt) => ({ x: (pt.x / 100) * w, y: (pt.y / 100) * h });
        lines.forEach((path, i) => path.setAttribute('d', curve(px(flow[i]), px(flow[i + 1]), !desktop)));
      };
      drawWires();
      window.addEventListener('resize', drawWires);
      const cleanup = () => window.removeEventListener('resize', drawWires);

      if (prefersReducedMotion()) {
        cards.forEach((c, i) => gsap.set(c, { left: `${flow[i].x}%`, top: `${flow[i].y}%`, rotate: 0, xPercent: -50, yPercent: -50 }));
        gsap.set(q('.face-messy'), { autoAlpha: 0 });
        gsap.set(q('.face-node'), { autoAlpha: 1 });
        gsap.set(q('.task-bg'), { opacity: 1 });
        gsap.set(lines, { strokeDashoffset: 0 });
        gsap.set(q('.hero-stage'), { opacity: desktop ? 0.22 : 0.07, scale: 0.9 });
        gsap.set(q('.hl-messy'), { autoAlpha: 0 });
        gsap.set(q('.hl-flow'), { autoAlpha: 0 });
        gsap.set(q('.hero-final'), { autoAlpha: 1, y: 0 });
        return cleanup;
      }

      // starting state
      cards.forEach((c, i) => gsap.set(c, { left: `${scatter[i].x}%`, top: `${scatter[i].y}%`, rotate: scatter[i].r, xPercent: -50, yPercent: -50 }));
      gsap.set(lines, { strokeDashoffset: 1 });
      gsap.set(q('.face-node'), { autoAlpha: 0 });
      gsap.set(q('.task-bg'), { opacity: 0 });
      gsap.set(q('.hl-flow'), { autoAlpha: 0, yPercent: 40 });
      gsap.set(q('.hero-final'), { autoAlpha: 0, y: 60 });
      gsap.set(q('.pulse'), { autoAlpha: 0, left: `${flow[0].x}%`, top: `${flow[0].y}%` });
      gsap.set(lits, { opacity: 0 });

      // entrance on load
      gsap.from(q('.hl-messy .w > span'), { yPercent: 120, duration: 1, ease: 'power4.out', stagger: 0.05, delay: 0.15 });
      gsap.from(q('.task-inner'), { scale: 0.4, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.08, delay: 0.4 });
      // idle float while waiting
      q('.task-inner').forEach((t, i) =>
        gsap.to(t, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${window.innerHeight * (desktop ? 2.6 : 2.2)}`, pin: true, scrub: 0.8, anticipatePin: 1 },
      });

      // 1. chaos → order
      tl.to(q('.scroll-hint'), { autoAlpha: 0, duration: 0.1 }, 0);
      cards.forEach((c, i) =>
        tl.to(c, { left: `${flow[i].x}%`, top: `${flow[i].y}%`, rotate: 0, duration: 1, ease: 'power2.inOut' }, i * 0.05));
      tl.to(q('.face-messy'), { autoAlpha: 0, duration: 0.3 }, 0.7);
      tl.to(q('.task-bg'), { opacity: 1, duration: 0.3 }, 0.7);
      tl.to(q('.face-node'), { autoAlpha: 1, duration: 0.3 }, 0.8);
      tl.to(q('.hl-messy'), { autoAlpha: 0, yPercent: -40, duration: 0.4 }, 0.6);
      tl.to(q('.hl-flow'), { autoAlpha: 1, yPercent: 0, duration: 0.4 }, 0.9);

      // 2. wires draw in sequence
      lines.forEach((l, i) => tl.to(l, { strokeDashoffset: 0, duration: 0.25 }, 1.3 + i * 0.22));

      // 3. a pulse runs through the workflow
      const pulseStart = 1.3 + lines.length * 0.22 + 0.1;
      tl.to(q('.pulse'), { autoAlpha: 1, duration: 0.05 }, pulseStart);
      tl.to(lits[0], { opacity: 1, duration: 0.1 }, pulseStart);
      flow.slice(1).forEach((p, i) => {
        tl.to(q('.pulse'), { left: `${p.x}%`, top: `${p.y}%`, duration: 0.2, ease: 'power1.inOut' }, pulseStart + i * 0.2);
        tl.to(lits[i + 1], { opacity: 1, duration: 0.08 }, pulseStart + (i + 1) * 0.2);
      });

      // 4. workflow steps back, name comes forward
      const outro = pulseStart + flow.length * 0.2 + 0.2;
      tl.to(q('.pulse'), { autoAlpha: 0, duration: 0.1 }, outro);
      tl.to(q('.hero-stage'), { scale: 0.86, opacity: desktop ? 0.2 : 0.07, duration: 0.6 }, outro);
      tl.to(q('.hl-flow'), { autoAlpha: 0, yPercent: -30, duration: 0.4 }, outro);
      tl.to(q('.hero-final'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, outro + 0.2);
      tl.to({}, { duration: 0.3 });
      return cleanup;
    });

    return () => mm.revert();
  }, [tasks.length, data.messyHeadline]);

  return (
    <section className="hero" ref={root} aria-label="Introduction">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-headlines">
        <h1 className="hl hl-messy" aria-label={data.messyHeadline}>
          {data.messyHeadline.split(' ').map((w, i) => (
            <span key={i}><span className="w" aria-hidden="true"><span>{w}</span></span>{' '}</span>
          ))}
        </h1>
        <p className="hl hl-flow">{data.flowHeadline}</p>
      </div>

      <div className="hero-stage" aria-hidden="true">
        <svg className="wires" viewBox="0 0 100 100" >
          {tasks.slice(1).map((_, i) => (
            <path key={i} className="wire" pathLength="1" />
          ))}
        </svg>
        {tasks.map((t, i) => (
          <div className="task" key={i}>
            <div className="task-inner">
              <span className="task-bg" />
              <span className="task-lit" />
              <span className="face face-messy">{t.messy}</span>
              <span className="face face-node"><b className="port" />{t.node}</span>
            </div>
          </div>
        ))}
        <span className="pulse" />
      </div>

      <div className="hero-final">
        <p className="hero-name">{data.name}</p>
        <p className="hero-intro">{data.intro}</p>
        <div className="hero-ctas">
          {data.primaryCta?.label && <MagneticButton to={data.primaryCta.path}>{data.primaryCta.label}</MagneticButton>}
          {data.secondaryCta?.label && <MagneticButton to={data.secondaryCta.path} variant="ghost">{data.secondaryCta.label}</MagneticButton>}
        </div>
      </div>

      <p className="scroll-hint" aria-hidden="true">Scroll to sort it out</p>
    </section>
  );
}
