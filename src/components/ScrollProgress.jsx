import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="progress" ref={ref} aria-hidden="true" />;
}
