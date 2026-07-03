import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PwaReloadPrompt } from '@/components/pwa/pwa-reload-prompt'
import { ThemeProvider } from '@/components/theme/theme-provider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <PwaReloadPrompt />
    </ThemeProvider>
  </StrictMode>,
)
