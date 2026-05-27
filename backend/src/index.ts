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
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

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
console.log('Routes configured');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

const PORT = config.port;

async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();

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
