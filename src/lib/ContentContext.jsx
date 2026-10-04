import { createContext, useContext, useEffect, useState } from 'react';
import initial from '../content/site.json';
import { applyTheme } from './theme';

const DRAFT_KEY = 'sharon-site-draft';
const Ctx = createContext(null);

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => loadDraft() || initial);
  const isDraft = content !== initial;

  useEffect(() => {
    applyTheme(content.theme);
    try {
      if (content === initial) sessionStorage.removeItem(DRAFT_KEY);
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify(content));
    } catch {
      /* storage unavailable: drafts just won't survive a reload */
    }
  }, [content]);

  const discardDraft = () => setContent(initial);

  return (
    <Ctx.Provider value={{ content, setContent, isDraft, discardDraft, published: initial }}>
      {children}
    </Ctx.Provider>
  );
}

export const useContent = () => useContext(Ctx);
