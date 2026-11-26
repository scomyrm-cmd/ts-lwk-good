import React, { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicSite } from './components/public/PublicSite';
const WorkspaceApp = lazy(() => import('./WorkspaceApp'));
const ContentManager = lazy(() => import('./components/cms/ContentManager').then(m => ({default:m.ContentManager})));
export default function App() {
  return <MotionConfig reducedMotion="user" transition={{ type: 'spring', bounce: 0, visualDuration: 0.32 }}><AppProvider><Suspense fallback={<div role="status" className="app-loading"><img src="/campus-mark.svg" width="48" height="48" alt="" /><span>Campus OS</span></div>}><SiteRouter /></Suspense></AppProvider></MotionConfig>;
}
function SiteRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const { isAuthenticated, isVerifyingAuth, currentUser, setActiveTab } = useApp();
  useEffect(() => { const tab = path.split('/')[2]; const alias:Record<string,string>={articles:'content',media:'content',events:'content',clubs:'content',logs:'activity'}; if (path.startsWith('/admin/') && tab !== 'login') setActiveTab(alias[tab] || tab || 'dashboard'); }, [path]);
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update); }, []);
  if (path === '/editor' && !isVerifyingAuth && isAuthenticated && currentUser && !currentUser.mustChangePassword) return <main className="p-4 md:p-8"><ContentManager /></main>;
  const privateRoute = /^\/(admin|login|student|campus|editor)(\/|$)/.test(path);
  if (privateRoute) return <WorkspaceApp />;
  return <PublicSite />;
}
