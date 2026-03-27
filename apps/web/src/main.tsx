// import './styles/main.css'
// import 'geist/style.css'
// oxlint-disable-next-line import/no-unassigned-import
import './styles/backup.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { z } from 'zod'

import { App } from './app'

z.config(z.locales.id())

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
