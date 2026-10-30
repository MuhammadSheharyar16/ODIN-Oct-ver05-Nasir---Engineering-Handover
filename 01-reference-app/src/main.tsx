import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/global.css';
import App from './App.tsx';
import { applyEnvironment } from './lib/environment';

// Virtual desktops (AVD): motion override, lite mode on software WebGL (ver05.4).
applyEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
