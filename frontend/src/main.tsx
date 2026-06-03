import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import GA4React from 'react-ga4'
import App from './App'
import './styles/index.css'

// Initialize Sentry for error tracking
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  })
  console.log('✅ Sentry error tracking initialized')
} else {
  console.log('⚠️  Sentry DSN not configured - error tracking disabled')
}

// Initialize Google Analytics
const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
if (gaId) {
  GA4React.initialize([{ trackingId: gaId }])
  console.log('✅ Google Analytics initialized')
} else {
  console.log('⚠️  Google Analytics ID not configured - analytics disabled')
}

const SentryApp = Sentry.withProfiler(App)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryApp />
  </React.StrictMode>,
)
