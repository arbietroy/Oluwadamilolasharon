import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useContent } from '../lib/ContentContext';
import { gsap, prefersReducedMotion } from '../lib/motion';
import SplitHeading from '../components/SplitHeading';
import { SmartLink } from '../components/SmartLink';
import { CTA } from '../sections/Blocks';
import NotFound from './NotFound';

export default function ProjectPage() {
  const { slug } = useParams();
  const { content } = useContent();
  const idx = content.projects.findIndex((p) => p.slug === slug);
  const p = content.projects[idx];
  const next = content.projects[(idx + 1) % content.projects.length];
  const ref = useRef(null);

  useEffect(() => { if (p) document.title = `${p.title} | ${content.site.name}`; }, [p, content.site.name]);

  useLayoutEffect(() => {
    if (!p) return;
    if (prefersReducedMotion()) {
      ref.current.querySelectorAll('.wf-step').forEach((s) => s.classList.add('is-on'));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo('.wf-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.wf-steps', start: 'top 55%', end: 'bottom 55%', scrub: true } });
      gsap.utils.toArray('.wf-step').forEach((s) => gsap.to(s, { scrollTrigger: { trigger: s, start: 'top 55%', toggleClass: 'is-on' } }));
      gsap.from('.case-meta > *', { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    }, ref);
    return () => ctx.revert();
  }, [slug, p]);

  if (!p) return <NotFound />;
  return (
    <main id="main" ref={ref}>
      <header className="page-header case-head">
        <SmartLink to="/projects" className="text-link back">All projects</SmartLink>
        <div data-fx="title-out"><SplitHeading as="h1" text={p.title} className="page-title" /></div>
        <p className="lede" data-fx="rise">{p.summary}</p>
        <dl className="case-meta">
          <div><dt>Built with</dt><dd>{p.tools?.join(', ')}</dd></div>
          <div><dt>Area</dt><dd>{p.tags?.join(', ')}</dd></div>
        </dl>
      </header>

      <section className="section case-ps">
        <div data-fx="left"><h2>The problem</h2><p>{p.problem}</p></div>
        <div data-fx="right"><h2>What I built</h2><p>{p.solution}</p></div>
      </section>

      <section className="section">
        <div className="section-head" data-skew><SplitHeading text="How it works" /></div>
        <ol className="wf-steps">
          <span className="wf-track" aria-hidden="true"><span className="wf-fill" /></span>
          {p.steps?.map((s, i) => (
            <li className="wf-step" key={i}>
              <span className="wf-node-ui" aria-hidden="true"><b className="port" /></span>
              <div><h3>{s.label}</h3><p>{s.detail}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {p.results?.length > 0 && (
        <section className="section">
          <div className="section-head" data-skew><SplitHeading text="What changed" /></div>
          <ul className="results">{p.results.map((r) => <li data-fx="scale" key={r}>{r}</li>)}</ul>
        </section>
      )}

      {next && next.slug !== p.slug && (
        <SmartLink to={`/projects/${next.slug}`} className="next-proj">
          <span>Next project</span>
          <strong data-fx="slide-x">{next.title}</strong>
        </SmartLink>
      )}
      <CTA data={{ heading: 'Want something like this?', body: '', button: { label: "Let's talk", path: '/contact' } }} />
    </main>
  );
}
