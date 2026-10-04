import { gsap, ScrollTrigger, prefersReducedMotion } from './motion';

// Site-wide scroll effects, switched on by data attributes:
//   data-fx="rise | left | right | scale | tilt | draw | drift | title-out | stagger"
//   data-speed="0.2"  with data-fx="parallax"
//   data-skew         leans with scroll speed
export function runScrollFX(root) {
  if (!root || prefersReducedMotion()) return () => {};
  const ctx = gsap.context(() => {
    const mobile = window.innerWidth < 760;
    const all = (sel) => gsap.utils.toArray(root.querySelectorAll(sel));
    const st = (el, extra = {}) => ({ trigger: el, start: 'top 88%', ...extra });

    all('[data-fx="rise"]').forEach((el) =>
      gsap.from(el, { y: 70, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: st(el) }));

    all('[data-fx="left"], [data-fx="right"]').forEach((el) =>
      gsap.from(el, { x: (el.dataset.fx === 'left' ? -1 : 1) * (mobile ? 36 : 120), opacity: 0, ease: 'none',
        scrollTrigger: st(el, { start: 'top 95%', end: 'top 55%', scrub: 0.6 }) }));

    all('[data-fx="scale"]').forEach((el) =>
      gsap.from(el, { scale: 0.78, opacity: 0, ease: 'none', scrollTrigger: st(el, { start: 'top 95%', end: 'top 60%', scrub: 0.6 }) }));

    all('[data-fx="tilt"]').forEach((el) =>
      gsap.from(el, { rotateX: mobile ? 10 : 22, y: mobile ? 50 : 90, opacity: 0.2, transformPerspective: 1100, transformOrigin: '50% 100%', ease: 'none',
        scrollTrigger: st(el, { start: 'top 100%', end: 'top 55%', scrub: 0.6 }) }));

    all('[data-fx="parallax"]').forEach((el) => {
      const s = parseFloat(el.dataset.speed || '0.2');
      gsap.fromTo(el, { yPercent: -100 * s }, { yPercent: 100 * s, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    if (!mobile) all('[data-fx="drift"]').forEach((el) =>
      gsap.fromTo(el, { x: -40 }, { x: 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));

    all('[data-fx="slide-x"]').forEach((el) =>
      gsap.from(el, { xPercent: mobile ? 12 : 35, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: true } }));

    all('[data-fx="stagger"]').forEach((el) =>
      gsap.from(el.children, { y: 50, opacity: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out', scrollTrigger: st(el) }));

    // big page titles sink and fade as you scroll past them
    all('[data-fx="title-out"]').forEach((el) =>
      gsap.to(el, { yPercent: 35, opacity: 0.15, scale: 0.94, transformOrigin: '0 100%', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 20%', end: 'bottom top', scrub: true } }));

    // project cover diagrams draw themselves when they appear
    all('[data-fx="draw"]').forEach((el) => {
      const tl = gsap.timeline({ scrollTrigger: st(el, { start: 'top 80%' }) });
      tl.fromTo(el.querySelectorAll('.wf-wire'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.15, ease: 'power2.inOut' })
        .from(el.querySelectorAll('.wf-node'), { scale: 0, duration: 0.5, stagger: 0.12, ease: 'back.out(2.5)' }, 0);
    });

    // elements lean with scroll speed
    const skews = mobile ? [] : all('[data-skew]');
    if (skews.length) {
      const setters = skews.map((el) => gsap.quickTo(el, 'skewY', { duration: 0.5, ease: 'power3' }));
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-6, 6, self.getVelocity() / -400);
          setters.forEach((set) => set(v));
        },
      });
    }
  }, root);
  return () => ctx.revert();
}
