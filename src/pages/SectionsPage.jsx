import { useEffect } from 'react';
import { useContent } from '../lib/ContentContext';
import { SECTIONS } from '../sections';
import NotFound from './NotFound';

export default function SectionsPage({ pageKey }) {
  const { content } = useContent();
  const page = content.pages[pageKey];
  useEffect(() => {
    if (page) document.title = pageKey === 'home' ? `${content.site.name} | ${content.site.role}` : `${page.title} | ${content.site.name}`;
  }, [page, pageKey, content.site]);
  if (!page) return <NotFound />;
  return (
    <main id="main">
      {page.sections.filter((s) => !s.hidden).map((s) => {
        const def = SECTIONS[s.type];
        if (!def) return null;
        const C = def.component;
        return <C key={s.id} data={s} />;
      })}
    </main>
  );
}
