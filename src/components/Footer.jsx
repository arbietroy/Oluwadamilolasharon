import { useLayoutEffect, useRef } from 'react';
import { useContent } from '../lib/ContentContext';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { SmartLink } from './SmartLink';

export default function Footer() {
  const { content } = useContent();
  const { site } = content;
  const ref = useRef(null);
  // the footer content rises up from underneath as you reach the bottom
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.footer-big', { yPercent: 70, opacity: 0, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top 30%', scrub: true } });
      gsap.from('.footer-row', { y: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'top 20%', scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <footer className="footer" ref={ref}>
      <div className="footer-big">
        <SmartLink to={`mailto:${site.email}`} className="footer-mail">{site.email}</SmartLink>
      </div>
      <div className="footer-row">
        <p>{site.footerNote}</p>
        <ul className="footer-socials">
          {site.socials.filter((s) => s.url).map((s) => (
            <li key={s.label}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>
          ))}
        </ul>
        <p>© {new Date().getFullYear()} {site.name}</p>
      </div>
    </footer>
  );
}
