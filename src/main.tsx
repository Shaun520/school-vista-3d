import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initViewport } from './utils/viewport'
import './styles/global.scss'

initViewport()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
