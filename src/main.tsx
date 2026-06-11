/**
 * @module main
 *
 * Client entry point: the composition root that mounts the React app. As
 * the top of the dependency graph it is the one place permitted to wire the
 * `ui/` shell to the page.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './ui';
import './index.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root not found.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
