import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useContent } from '../lib/ContentContext';

export default function Nav() {
  const { content } = useContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (Math.abs(y - last) > 6) { setHidden(y > last && y > 240); last = y; }
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''} ${hidden && !open ? 'is-hidden' : ''}`}>
      <NavLink to="/" className="nav-logo" aria-label={`${content.site.name}, home`}>
        <span className="logo-dot" aria-hidden="true" />
        {content.site.name}
      </NavLink>
      <button className="nav-toggle" aria-expanded={open} aria-controls="nav-menu" onClick={() => setOpen(!open)}>
        <span className="sr-only">Menu</span>
        <i /><i />
      </button>
      <nav id="nav-menu" className="nav-links">
        {content.site.nav.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
