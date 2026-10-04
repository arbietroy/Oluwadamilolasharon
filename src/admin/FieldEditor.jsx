import { useContent } from '../lib/ContentContext';

const LONG = new Set(['body', 'text', 'intro', 'summary', 'problem', 'solution', 'a', 'detail', 'footerNote', 'messyHeadline', 'flowHeadline', 'successMessage']);
const SKIP = new Set(['id', 'type', 'hidden']);

export const humanize = (k) =>
  ({ q: 'Question', a: 'Answer', cta: 'Button', url: 'Link', path: 'Links to', formEndpoint: 'Form webhook URL (n8n, Formspree…)', slugs: 'Projects to show', photoUrl: 'Photo URL' }[k] ||
  k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).replace(/ (.)/g, (m) => m.toLowerCase()));

function blank(v) {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return '';
}

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

function ItemControls({ arr, i, onChange }) {
  return (
    <span className="ad-item-ctrl">
      <button type="button" onClick={() => onChange(move(arr, i, -1))} disabled={i === 0} aria-label="Move up">↑</button>
      <button type="button" onClick={() => onChange(move(arr, i, 1))} disabled={i === arr.length - 1} aria-label="Move down">↓</button>
      <button type="button" onClick={() => onChange(arr.filter((_, x) => x !== i))} aria-label="Remove">✕</button>
    </span>
  );
}

function SlugPicker({ value = [], onChange }) {
  const { content } = useContent();
  return (
    <div className="ad-field">
      <span className="ad-label">Projects to show</span>
      <div className="ad-checks">
        {content.projects.map((p) => (
          <label key={p.slug}>
            <input type="checkbox" checked={value.includes(p.slug)}
              onChange={(e) => onChange(e.target.checked ? [...value, p.slug] : value.filter((s) => s !== p.slug))} />
            {p.title}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FieldEditor({ name, value, onChange, depth = 0 }) {
  if (name === 'slugs') return <SlugPicker value={value} onChange={onChange} />;

  if (typeof value === 'boolean') {
    return (
      <label className="ad-toggle">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {humanize(name)}
      </label>
    );
  }
  if (typeof value === 'number') {
    return (
      <label className="ad-field"><span className="ad-label">{humanize(name)}</span>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  }
  if (typeof value === 'string') {
    if (name === 'coverColor') {
      return (
        <label className="ad-field"><span className="ad-label">Card colour</span>
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {['primary', 'accent', 'ink', 'surface'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)} colour</option>)}
          </select>
        </label>
      );
    }
    if (/color$/i.test(name)) {
      return (
        <label className="ad-field"><span className="ad-label">{humanize(name)}</span>
          <span className="ad-color"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
            <input value={value} onChange={(e) => onChange(e.target.value)} /></span>
        </label>
      );
    }
    const long = LONG.has(name) || value.length > 70;
    return (
      <label className="ad-field"><span className="ad-label">{humanize(name)}</span>
        {long
          ? <textarea rows={Math.min(8, Math.max(2, Math.ceil(value.length / 60)))} value={value} onChange={(e) => onChange(e.target.value)} />
          : <input value={value} onChange={(e) => onChange(e.target.value)} />}
      </label>
    );
  }
  if (Array.isArray(value)) {
    const objects = value.length > 0 && typeof value[0] === 'object';
    const template = value[0] !== undefined ? blank(value[0]) : '';
    return (
      <fieldset className="ad-list">
        <legend>{humanize(name)} <small>({value.length})</small></legend>
        {value.map((item, i) => (
          <div className={objects ? 'ad-list-obj' : 'ad-list-row'} key={i}>
            {objects ? (
              <>
                <div className="ad-list-head">
                  <strong>{Object.values(item).find((x) => typeof x === 'string' && x) || `Item ${i + 1}`}</strong>
                  <ItemControls arr={value} i={i} onChange={onChange} />
                </div>
                {Object.entries(item).map(([k, v]) => (
                  <FieldEditor key={k} name={k} value={v} depth={depth + 1}
                    onChange={(nv) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: nv } : x)))} />
                ))}
              </>
            ) : (
              <>
                <input value={item} aria-label={`${humanize(name)} ${i + 1}`} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
                <ItemControls arr={value} i={i} onChange={onChange} />
              </>
            )}
          </div>
        ))}
        <button type="button" className="ad-add" onClick={() => onChange([...value, template])}>Add {objects ? 'item' : 'line'}</button>
      </fieldset>
    );
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([k]) => !SKIP.has(k));
    const inner = entries.map(([k, v]) => (
      <FieldEditor key={k} name={k} value={v} depth={depth + 1} onChange={(nv) => onChange({ ...value, [k]: nv })} />
    ));
    if (depth === 0) return <div className="ad-fields">{inner}</div>;
    return <fieldset className="ad-group"><legend>{humanize(name)}</legend>{inner}</fieldset>;
  }
  return null;
}
