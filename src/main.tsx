import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ShowcasePage from './components/ShowcasePage.tsx';
import './index.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const root = createRoot(document.getElementById('root')!);
const path = window.location.pathname;
const firstSegment = path.split('/')[1] || '';
const isUsernameRoute = firstSegment !== '' && firstSegment !== 'showcase' && !path.slice(1).includes('/');

async function resolveByName(slug: string) {
  const snap = await getDocs(collection(db, 'users'));
  const match = snap.docs.find((d) => slugify(d.data().name || '') === slug);
  if (match) {
    window.location.replace(`/showcase/${match.id}`);
  } else {
    document.getElementById('root')!.innerHTML =
      '<div style="padding:40px;font-family:sans-serif;text-align:center"><h1>404</h1><p>User not found</p></div>';
  }
}

if (path.startsWith('/showcase/')) {
  root.render(<StrictMode><ShowcasePage /></StrictMode>);
} else if (isUsernameRoute) {
  resolveByName(firstSegment);
} else {
  root.render(<StrictMode><App /></StrictMode>);
}