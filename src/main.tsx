import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PwaReloadPrompt } from '@/components/pwa/pwa-reload-prompt'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PwaReloadPrompt />
  </StrictMode>,
)
