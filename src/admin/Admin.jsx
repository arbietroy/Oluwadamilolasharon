import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/ContentContext';
import { FONT_OPTIONS } from '../lib/theme';
import { SECTIONS } from '../sections';
import FieldEditor, { humanize } from './FieldEditor';

const PRESETS = [
  { name: 'Sky and lime', colors: { primary: '#A9D6F5', background: '#EEF6FC', ink: '#0B1F3A', accent: '#C6F432', surface: '#FFFFFF' } },
  { name: 'Mint and sunshine', colors: { primary: '#A8E8CB', background: '#EFFAF4', ink: '#0F2A33', accent: '#FFE14D', surface: '#FFFFFF' } },
  { name: 'Blush and forest', colors: { primary: '#F6C9D6', background: '#FCF3F6', ink: '#10302A', accent: '#63E6A8', surface: '#FFFFFF' } },
  { name: 'Butter and navy', colors: { primary: '#F6E27F', background: '#FBF8EC', ink: '#14213D', accent: '#7FD6FF', surface: '#FFFFFF' } },
  { name: 'Concrete and aqua', colors: { primary: '#D4D7DD', background: '#F4F5F7', ink: '#111827', accent: '#45F0E0', surface: '#FFFFFF' } },
];

const uid = (t) => `${t}-${Math.random().toString(36).slice(2, 7)}`;
const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

function Login({ onEnter }) {
  const [pw, setPw] = useState('');
  return (
    <div className="ad-login">
      <form onSubmit={(e) => { e.preventDefault(); onEnter(pw); }}>
        <h1>Site editor</h1>
        <p>Enter your admin password. It's checked when you publish.</p>
        <label className="ad-field"><span className="ad-label">Password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </label>
        <button className="ad-btn ad-primary" type="submit">Open editor</button>
        <Link to="/" className="ad-muted">Back to the site</Link>
      </form>
    </div>
  );
}

function SectionCard({ s, i, total, onChange, onMove, onRemove, onDuplicate }) {
  const [open, setOpen] = useState(false);
  const def = SECTIONS[s.type];
  const title = s.heading || s.messyHeadline || s.label || def?.label || s.type;
  return (
    <li className={`ad-section ${s.hidden ? 'is-hidden' : ''}`}>
      <div className="ad-section-head">
        <button className="ad-expand" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="ad-type">{def?.label || s.type}</span>
          <strong>{title}</strong>
        </button>
        <span className="ad-item-ctrl">
          <button onClick={() => onMove(-1)} disabled={i === 0} aria-label="Move section up">↑</button>
          <button onClick={() => onMove(1)} disabled={i === total - 1} aria-label="Move section down">↓</button>
          <button onClick={() => onChange({ ...s, hidden: !s.hidden })}>{s.hidden ? 'Show' : 'Hide'}</button>
          <button onClick={onDuplicate}>Duplicate</button>
          <button onClick={() => { if (confirm('Delete this section?')) onRemove(); }}>Delete</button>
        </span>
      </div>
      {open && (
        <div className="ad-section-body">
          {Object.keys(s).filter((k) => !['id', 'type', 'hidden'].includes(k)).length === 0
            ? <p className="ad-muted">This section fills itself from your {s.type === 'projectGrid' ? 'Projects' : 'Services'} tab.</p>
            : <FieldEditor name="section" value={s} onChange={onChange} />}
        </div>
      )}
    </li>
  );
}

function PageEditor({ pageKey }) {
  const { content, setContent } = useContent();
  const page = content.pages[pageKey];
  const [newType, setNewType] = useState('text');
  const setSections = (sections) =>
    setContent({ ...content, pages: { ...content.pages, [pageKey]: { ...page, sections } } });
  const secs = page.sections;
  return (
    <div>
      <div className="ad-page-head">
        <h2>{page.title} page</h2>
        <Link className="ad-btn" to={pageKey === 'home' ? '/' : `/${pageKey}`}>Preview this page</Link>
      </div>
      <ol className="ad-sections">
        {secs.map((s, i) => (
          <SectionCard key={s.id} s={s} i={i} total={secs.length}
            onChange={(ns) => setSections(secs.map((x) => (x.id === s.id ? ns : x)))}
            onMove={(d) => setSections(move(secs, i, d))}
            onRemove={() => setSections(secs.filter((x) => x.id !== s.id))}
            onDuplicate={() => setSections([...secs.slice(0, i + 1), { ...structuredClone(s), id: uid(s.type) }, ...secs.slice(i + 1)])} />
        ))}
      </ol>
      <div className="ad-addsection">
        <label className="ad-field"><span className="ad-label">Add a section</span>
          <select value={newType} onChange={(e) => setNewType(e.target.value)}>
            {Object.entries(SECTIONS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
          </select>
        </label>
        <button className="ad-btn ad-primary" onClick={() =>
          setSections([...secs, { id: uid(newType), type: newType, hidden: false, ...structuredClone(SECTIONS[newType].defaults) }])}>
          Add to bottom
        </button>
      </div>
    </div>
  );
}

function CollectionEditor({ field, singular, template, itemTitle }) {
  const { content, setContent } = useContent();
  const list = content[field];
  const [open, setOpen] = useState(-1);
  const set = (l) => setContent({ ...content, [field]: l });
  return (
    <div>
      <div className="ad-page-head"><h2>{humanize(field)}</h2></div>
      <ol className="ad-sections">
        {list.map((item, i) => (
          <li className="ad-section" key={i}>
            <div className="ad-section-head">
              <button className="ad-expand" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span className="ad-type">{singular}</span><strong>{itemTitle(item)}</strong>
              </button>
              <span className="ad-item-ctrl">
                <button onClick={() => set(move(list, i, -1))} disabled={i === 0} aria-label="Move up">↑</button>
                <button onClick={() => set(move(list, i, 1))} disabled={i === list.length - 1} aria-label="Move down">↓</button>
                <button onClick={() => { if (confirm(`Delete this ${singular.toLowerCase()}?`)) set(list.filter((_, x) => x !== i)); }}>Delete</button>
              </span>
            </div>
            {open === i && (
              <div className="ad-section-body">
                <FieldEditor name="item" value={item} onChange={(nv) => set(list.map((x, j) => (j === i ? nv : x)))} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <button className="ad-btn ad-primary" onClick={() => { set([...list, template()]); setOpen(list.length); }}>Add {singular.toLowerCase()}</button>
    </div>
  );
}

function ThemeEditor() {
  const { content, setContent } = useContent();
  const t = content.theme;
  const set = (patch) => setContent({ ...content, theme: { ...t, ...patch } });
  return (
    <div className="ad-theme">
      <div className="ad-page-head"><h2>Look and feel</h2></div>
      <h3>Colour presets</h3>
      <div className="ad-presets">
        {PRESETS.map((p) => (
          <button key={p.name} className="ad-preset" onClick={() => set({ colors: p.colors })}>
            <span className="ad-swatches">{Object.values(p.colors).slice(0, 4).map((c) => <i key={c} style={{ background: c }} />)}</span>
            {p.name}
          </button>
        ))}
      </div>
      <h3>Colours</h3>
      <div className="ad-grid2">
        {Object.entries(t.colors).map(([k, v]) => (
          <FieldEditor key={k} name={`${k}Color`} value={v} onChange={(nv) => set({ colors: { ...t.colors, [k]: nv } })} />
        ))}
      </div>
      <p className="ad-muted">Primary is your lilac. Ink is used for text and dark sections. Accent is the small highlight colour.</p>
      <h3>Fonts</h3>
      <div className="ad-grid2">
        {['display', 'body'].map((role) => (
          <label className="ad-field" key={role}><span className="ad-label">{role === 'display' ? 'Headings' : 'Body text'}</span>
            <select value={t.fonts[role]} onChange={(e) => set({ fonts: { ...t.fonts, [role]: e.target.value } })}>
              {Object.keys(FONT_OPTIONS).map((f) => <option key={f}>{f}</option>)}
            </select>
            <span className="ad-fontpreview" style={{ fontFamily: `"${t.fonts[role]}"` }}>Systems that run themselves</span>
          </label>
        ))}
      </div>
      <h3>Shape and motion</h3>
      <label className="ad-field"><span className="ad-label">Corner roundness: {t.radius}px</span>
        <input type="range" min="0" max="40" value={t.radius} onChange={(e) => set({ radius: Number(e.target.value) })} />
      </label>
      <label className="ad-toggle"><input type="checkbox" checked={t.animations} onChange={(e) => set({ animations: e.target.checked })} /> Scroll animations on</label>
    </div>
  );
}

export default function Admin() {
  const { content, setContent, isDraft, discardDraft } = useContent();
  const [pw, setPw] = useState(() => sessionStorage.getItem('sharon-admin') || null);
  const [tab, setTab] = useState('page:home');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Site editor'; }, []);
  if (pw === null) return <Login onEnter={(p) => { setPw(p); try { sessionStorage.setItem('sharon-admin', p); } catch { /* ignore */ } }} />;

  async function publish() {
    setBusy(true);
    setMsg({ kind: 'info', text: 'Publishing…' });
    try {
      const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw, content }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Publishing failed (status ${res.status}).`);
      setMsg({ kind: 'ok', text: 'Published. Your live site updates in about a minute.' });
    } catch (e) {
      setMsg({ kind: 'err', text: `${e.message} If you're in a preview without the server, use "Download content file" instead.` });
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site.json';
    a.click();
  }

  const tabs = [
    ...Object.entries(content.pages).map(([k, p]) => ({ id: `page:${k}`, label: `${p.title} page` })),
    { id: 'projects', label: 'Project details' },
    { id: 'services', label: 'Service details' },
    { id: 'theme', label: 'Colours and fonts' },
    { id: 'site', label: 'Site settings' },
  ];

  return (
    <div className="admin">
      <header className="ad-top">
        <strong>Site editor</strong>
        <span className={`ad-status ${isDraft ? 'is-draft' : ''}`}>{isDraft ? 'Unpublished changes' : 'Up to date'}</span>
        <div className="ad-top-actions">
          <Link className="ad-btn" to="/">View site</Link>
          <button className="ad-btn" onClick={download}>Download content file</button>
          <button className="ad-btn" disabled={!isDraft} onClick={() => { if (confirm('Discard all unpublished changes?')) discardDraft(); }}>Discard changes</button>
          <button className="ad-btn ad-primary" disabled={busy} onClick={publish}>Publish</button>
        </div>
      </header>
      {msg && <p className={`ad-msg ad-${msg.kind}`} role="status">{msg.text}</p>}
      <div className="ad-body">
        <nav className="ad-nav" aria-label="Editor sections">
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <main className="ad-main">
          {tab.startsWith('page:') && <PageEditor key={tab} pageKey={tab.slice(5)} />}
          {tab === 'projects' && (
            <CollectionEditor field="projects" singular="Project" itemTitle={(p) => p.title || 'Untitled project'}
              template={() => ({ slug: `project-${Date.now().toString(36)}`, title: 'New project', summary: '', liveUrl: '', tags: ['Workflow'], tools: ['n8n'], coverColor: 'primary', problem: '', solution: '', steps: [{ label: 'Step', detail: '' }], results: [''] })} />
          )}
          {tab === 'services' && (
            <CollectionEditor field="services" singular="Service" itemTitle={(s) => s.title || 'Untitled service'}
              template={() => ({ title: 'New service', text: '', examples: [''] })} />
          )}
          {tab === 'theme' && <ThemeEditor />}
          {tab === 'site' && (
            <div>
              <div className="ad-page-head"><h2>Site settings</h2></div>
              <FieldEditor name="site" value={content.site} onChange={(site) => setContent({ ...content, site })} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
