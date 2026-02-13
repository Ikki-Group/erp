// import './styles/main.css'
// import 'geist/style.css'
import './styles/backup.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { z } from 'zod'

z.config(z.locales.id())

import { App } from './app'

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
