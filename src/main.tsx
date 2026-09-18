import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/alexandria/latin-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/rajdhani/latin-600.css'
import '@fontsource/rajdhani/latin-700.css'
import './styles/global.css'
import './styles/layout.css'
import './styles/controls.css'
import './styles/dashboard.css'
import './styles/dashboard-cards.css'
import './styles/orders.css'
import './styles/dialogs.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
