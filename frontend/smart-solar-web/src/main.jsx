// ============================================================================
// File: main.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: React application entry point.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import './styles/frequenzTheme.css'
import './styles/dashTheme.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
