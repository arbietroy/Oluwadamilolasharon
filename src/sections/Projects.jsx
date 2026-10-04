import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useContent } from '../lib/ContentContext';
import SplitHeading from '../components/SplitHeading';
import { SmartLink } from '../components/SmartLink';
import WorkflowArt from './WorkflowArt';
import { resolveColor } from '../lib/theme';

function isDark(hex = '#ffffff') {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return r * 0.299 + g * 0.587 + b * 0.114 < 140;
}

export function ProjectCard({ p, big }) {
  const { content } = useContent();
  const cover = resolveColor(p.coverColor, content.theme);
  const dark = isDark(cover.hex);
  return (
    <article className={`proj-card ${big ? 'proj-big' : ''} ${dark ? 'on-dark' : ''}`} style={{ '--cover': cover.css }}>
      <div className="proj-art" data-fx="draw"><WorkflowArt steps={p.steps} color={dark ? 'var(--primary)' : 'var(--ink)'} /></div>
      <div className="proj-text">
        <ul className="proj-tags">{p.tags?.map((t) => <li key={t}>{t}</li>)}</ul>
        <h3>{p.title}</h3>
        <p>{p.summary}</p>
        <div className="proj-links">
          {/* this link stretches over the whole card; the live link sits above it */}
          <SmartLink to={`/projects/${p.slug}`} className="proj-open">Read the case study</SmartLink>
          {p.liveUrl && <SmartLink to={p.liveUrl} className="proj-live">Visit live site ↗</SmartLink>}
        </div>
      </div>
    </article>
  );
}

// Cards stack on top of each other as you scroll, the ones behind shrinking back
export function FeaturedProjects({ data }) {
  const { content } = useContent();
  const ref = useRef(null);
  const list = (data.slugs || []).map((s) => content.projects.find((p) => p.slug === s)).filter(Boolean);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      if (window.innerWidth <= 800) return; // cards don't stack on phones
      const cards = gsap.utils.toArray('.stack-item');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.to(card.querySelector('.proj-card'), {
          scale: 0.9, opacity: 0.45, ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 15%', scrub: true },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [list.length]);
  return (
    <section className="section" ref={ref}>
      <div className="section-head" data-skew>
        <SplitHeading text={data.heading} />
        {data.body && <p className="lede" data-fx="rise">{data.body}</p>}
      </div>
      <div className="stack">
        {list.map((p, i) => (
          <div className="stack-item" key={p.slug} style={{ top: `calc(90px + ${i * 14}px)` }}>
            <ProjectCard p={p} big />
          </div>
        ))}
      </div>
      <div className="center-row"><SmartLink to="/projects" className="text-link">All projects</SmartLink></div>
    </section>
  );
}

export function ProjectGrid() {
  const { content } = useContent();
  const [tag, setTag] = useState('All');
  const ref = useRef(null);
  const tags = useMemo(() => ['All', ...new Set(content.projects.flatMap((p) => p.tags || []))], [content.projects]);
  const shown = content.projects.filter((p) => tag === 'All' || p.tags?.includes(tag));
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.grid-item > .proj-card', { y: 50, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [tag]);
  return (
    <section className="section section-tight" ref={ref}>
      <div className="filters" data-fx="stagger" role="group" aria-label="Filter projects">
        {tags.map((t) => (
          <button key={t} className={t === tag ? 'is-on' : ''} aria-pressed={t === tag} onClick={() => setTag(t)}>{t}</button>
        ))}
      </div>
      <div className="proj-grid">
        {shown.map((p) => <div className="grid-item" data-fx="tilt" key={p.slug}><ProjectCard p={p} /></div>)}
      </div>
    </section>
  );
}
