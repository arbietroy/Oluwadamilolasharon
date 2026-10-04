// Small generated diagram of a project's workflow, used as its cover image
export default function WorkflowArt({ steps = [], color = 'var(--primary)' }) {
  const n = Math.max(steps.length, 2);
  const pts = steps.map((_, i) => ({ x: 14 + i * (72 / (n - 1)), y: i % 2 ? 62 : 38 }));
  return (
    <svg className="wf-art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {pts.slice(1).map((p, i) => {
        const a = pts[i];
        return <path key={i} d={`M${a.x} ${a.y} C${(a.x + p.x) / 2} ${a.y}, ${(a.x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`} className="wf-wire" pathLength="1" />;
      })}
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={p.x - 6} y={p.y - 6} width="12" height="12" rx="3.5" className="wf-node" style={{ fill: i === pts.length - 1 ? color : undefined }} />
        </g>
      ))}
    </svg>
  );
}
