import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import GA4React from 'react-ga4'
import App from './App'
import './styles/index.css'

// Initialize Sentry for error tracking
Sentry.init({
  dsn: 'https://846250ed469381684fe3b7efee90e492@o4511503161950208.ingest.us.sentry.io/4511503172632576',
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  sendDefaultPii: true,
})
console.log('✅ Sentry error tracking initialized')

// Initialize Google Analytics
GA4React.initialize([{ trackingId: 'G-KX2GGSYPGM' }])
console.log('✅ Google Analytics initialized')

const SentryApp = Sentry.withProfiler(App)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryApp />
  </React.StrictMode>,
)
