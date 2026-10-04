import { Link } from 'react-router-dom';
import { useRef, useEffect, forwardRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';

export const SmartLink = forwardRef(function SmartLink({ to = '/', children, ...rest }, ref) {
  if (/^(https?:|mailto:|tel:)/.test(to)) {
    return <a ref={ref} href={to} target={to.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...rest}>{children}</a>;
  }
  return <Link ref={ref} to={to} {...rest}>{children}</Link>;
});

// Button that drifts toward the cursor on hover (desktop pointers only)
export function MagneticButton({ to, children, variant = 'solid', ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4, ease: 'power3.out' });
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
  }, []);
  return (
    <SmartLink to={to} ref={ref} className={`btn btn-${variant}`} {...rest}>
      <span>{children}</span>
    </SmartLink>
  );
}
