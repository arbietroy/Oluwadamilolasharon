import { MagneticButton } from '../components/SmartLink';
export default function NotFound() {
  return (
    <main id="main" className="page-header notfound">
      <h1 className="page-title">This page isn't wired up.</h1>
      <p className="lede">The link may be old, or the page was renamed.</p>
      <MagneticButton to="/">Go to the home page</MagneticButton>
    </main>
  );
}
