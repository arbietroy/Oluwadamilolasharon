import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { ContentProvider, useContent } from './lib/ContentContext';
import { startSmoothScroll } from './lib/motion';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import PageTransition from './components/PageTransition';
import SectionsPage from './pages/SectionsPage';
import ProjectPage from './pages/ProjectPage';
import NotFound from './pages/NotFound';
import Admin from './admin/Admin';

const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

function DraftBar() {
  const { isDraft } = useContent();
  const { pathname } = useLocation();
  if (!isDraft || pathname.startsWith('/admin')) return null;
  return <Link className="draft-bar" to="/admin">You're previewing unpublished edits. Back to the editor</Link>;
}

function Site() {
  const { content } = useContent();
  useEffect(() => { startSmoothScroll(); }, []);
  const pageKeys = Object.keys(content.pages).filter((k) => k !== 'home');
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <ScrollProgress />
      <Nav />
      <PageTransition>
        <Routes>
          <Route path="/" element={<SectionsPage pageKey="home" />} />
          {pageKeys.map((k) => <Route key={k} path={`/${k}`} element={<SectionsPage pageKey={k} />} />)}
          <Route path="/projects/:slug" element={<ProjectPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      <Footer />
      <DraftBar />
    </>
  );
}

export default function App() {
  return (
    <ContentProvider>
      <Router>
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Site />} />
        </Routes>
      </Router>
    </ContentProvider>
  );
}
