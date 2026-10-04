// Fonts available in the admin. Each entry is a Google Fonts family + weight spec.
export const FONT_OPTIONS = {
  'Schibsted Grotesk': 'Schibsted+Grotesk:wght@400..900',
  'Figtree': 'Figtree:wght@300..900',
  'Source Serif 4': 'Source+Serif+4:opsz,wght@8..60,300..800',
  'Archivo': 'Archivo:wdth,wght@62..125,300..900',
  'Onest': 'Onest:wght@300..800',
  'Familjen Grotesk': 'Familjen+Grotesk:wght@400..700',
  'Hanken Grotesk': 'Hanken+Grotesk:wght@300..800',
  'Schibsted Grotesk': 'Schibsted+Grotesk:wght@400..900',
  'Bricolage Grotesque': 'Bricolage+Grotesque:opsz,wght@12..96,300..800',
  'Big Shoulders Display': 'Big+Shoulders+Display:wght@400..900',
  'Anybody': 'Anybody:wdth,wght@50..150,300..900',
  'Gloock': 'Gloock',
  'Newsreader': 'Newsreader:opsz,wght@6..72,300..800',
  'Literata': 'Literata:opsz,wght@7..72,300..800',
};
// fonts with a width axis are drawn wide for headings
export const WIDE_FONTS = { 'Archivo': '118%', 'Anybody': '125%' };

const FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function loadFont(name) {
  const spec = FONT_OPTIONS[name];
  if (!spec) return;
  const id = 'font-' + name.replace(/\s+/g, '-');
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
}

const TOKENS = { primary: 'primary', accent: 'accent', ink: 'ink', surface: 'surface', background: 'bg' };

// A colour can be a theme name (primary, accent, ink, surface, background) or a hex code
export function resolveColor(value, theme) {
  if (TOKENS[value]) return { css: `var(--${TOKENS[value]})`, hex: theme.colors[value] };
  return { css: value || 'var(--primary)', hex: value || theme.colors.primary };
}

// Mix two hex colours (t = 0..1 toward b)
export function mix(a, b, t) {
  const p = (h) => h.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16));
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement.style;
  const { colors, fonts } = theme;
  loadFont(fonts.display);
  loadFont(fonts.body);
  root.setProperty('--font-display', `"${fonts.display}", ${FALLBACK}`);
  root.setProperty('--font-body', `"${fonts.body}", ${FALLBACK}`);
  root.setProperty('--display-stretch', WIDE_FONTS[fonts.display] || '100%');
  root.setProperty('--primary', colors.primary);
  root.setProperty('--bg', colors.background);
  root.setProperty('--ink', colors.ink);
  root.setProperty('--accent', colors.accent);
  root.setProperty('--surface', colors.surface);
  // derived tones
  root.setProperty('--ink-soft', mix(colors.ink, colors.background, 0.28));
  root.setProperty('--primary-deep', mix(colors.primary, colors.ink, 0.35));
  root.setProperty('--primary-soft', mix(colors.primary, colors.background, 0.55));
  root.setProperty('--on-ink', mix(colors.background, '#ffffff', 0.4));
  root.setProperty('--line', mix(colors.ink, colors.background, 0.82));
  root.setProperty('--radius', `${theme.radius ?? 22}px`);
  document.documentElement.dataset.motion = theme.animations === false ? 'off' : 'on';
}
