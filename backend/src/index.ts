import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { pool } from './config/database';
import { initializeDatabase } from './config/initDatabase';
import authRoutes from './routes/auth';
import budgetRoutes from './routes/budgets';
import categoryRoutes from './routes/categories';
import transactionRoutes from './routes/transactions';
import importRoutes from './routes/import';
import projectionRoutes from './routes/projections';
import analyticsRoutes from './routes/analytics';
import billsRoutes from './routes/bills';
import goalsRoutes from './routes/goals';
import templatesRoutes from './routes/templates';
import wellnessRoutes from './routes/wellness';
import insightsRoutes from './routes/insights';
import advancedBudgetingRoutes from './routes/advanced-budgeting';
import investmentRoutes from './routes/investments';
import subscriptionRoutes from './routes/subscriptions';
import settingsRoutes from './routes/settings';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import smartRulesRoutes from './routes/smart-rules';
import alertRoutes from './routes/alerts';
import emailReportsRoutes from './routes/emailReports';
import searchRoutes from './routes/search';
import phase4ProjectionsRoutes from './routes/phase4-projections';
import phase4AnalyticsRoutes from './routes/phase4-analytics';
import organizationsRoutes from './routes/organizations';
import auditLogsRoutes from './routes/auditLogs';
import adminDashboardRoutes from './routes/adminDashboard';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { auditRequestSetup, auditErrorLogger } from './middleware/auditLog';
import { applyRateLimit } from './middleware/rateLimit';
import { loadUserOrganizations } from './middleware/permissions';
import { initializeScheduler } from './jobs/reportSchedulerJob';
import { initializePhase4Jobs } from './jobs/phase4-calculation-jobs';
import { initializeEnterpriseMetricsJobs } from './jobs/enterpriseMetricsJob';
import { verifyEmailConfiguration } from './services/emailService';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin];
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Phase 8: Enterprise Features Middleware (with feature flag)
if (config.enableOrganizations) {
  console.log('Enterprise Features enabled - initializing RBAC, audit logging, and rate limiting middleware');

  // Request setup for audit and rate limiting context
  app.use(auditRequestSetup);

  // Rate limiting middleware (applied to all authenticated requests)
  app.use(applyRateLimit);

  // Load user organizations (populate req.userOrganizations)
  app.use(loadUserOrganizations);
} else {
  console.log('Enterprise Features disabled - ENABLE_ORGANIZATIONS=false');
}

// Swagger JSON endpoint (must come before swagger-ui.serve)
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs/swagger.json',
  },
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: String(error) });
  }
});

// Routes
console.log('Setting up routes...');
console.log('Auth routes:', typeof authRoutes);
console.log('Budget routes:', typeof budgetRoutes);
console.log('Alert routes type:', typeof alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/import', importRoutes);
app.use('/api/projections', projectionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/budgeting', advancedBudgetingRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/user/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/smart-rules', smartRulesRoutes);
console.log('Mounting alerts routes to /api/alerts...');
app.use('/api/alerts', alertRoutes);
console.log('✓ Alerts routes mounted');
app.use('/api/email-reports', emailReportsRoutes);
console.log('Mounting search routes to /api/search...');
console.log('Search routes type:', typeof searchRoutes);
app.use('/api/search', searchRoutes);
console.log('✓ Search routes mounted');
console.log('Mounting Phase 4 projections routes to /api/phase4/projections...');
app.use('/api/phase4/projections', phase4ProjectionsRoutes);
console.log('✓ Phase 4 projections routes mounted');
console.log('Mounting Phase 4 analytics routes to /api/phase4/analytics...');
app.use('/api/phase4/analytics', phase4AnalyticsRoutes);
console.log('✓ Phase 4 analytics routes mounted');

// Phase 8: Enterprise Features Routes (with feature flag)
if (config.enableOrganizations) {
  console.log('Mounting enterprise feature routes...');
  app.use('/api/organizations', organizationsRoutes);
  console.log('✓ Organizations routes mounted');
  app.use('/api/audit-logs', auditLogsRoutes);
  console.log('✓ Audit logs routes mounted');
  app.use('/api/admin/dashboard', adminDashboardRoutes);
  console.log('✓ Admin dashboard routes mounted');
}

console.log('Routes configured');
console.log('Total middleware/routes in app stack:', app._router.stack.length);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Phase 8: Error handler for audit logging
if (config.enableOrganizations) {
  app.use(auditErrorLogger);
}

// Error handler
app.use(errorHandler);

const PORT = config.port;

async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Verify email configuration (commented out to allow server to start without email service)
    // await verifyEmailConfiguration();

    // Initialize report and alert scheduler
    initializeScheduler();

    // Initialize Phase 4 calculation jobs
    initializePhase4Jobs();

    // Initialize Phase 8 enterprise metrics jobs (with feature flag)
    if (config.enableOrganizations) {
      initializeEnterpriseMetricsJobs();
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
