import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './student.css'
import './teacher.css'
import './admin.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
