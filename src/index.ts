import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import campaignRoutes from './routes/campaign.routes';
import loyaltyRoutes from './routes/loyalty.routes';
import analyticsRoutes from './routes/analytics.routes';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Public Routes (Authentication)
app.use(`${apiPrefix}/auth`, authRoutes);

// Protected Routes
app.use(authMiddleware);

// Customer Management
app.use(`${apiPrefix}/customers`, customerRoutes);

// Product Catalog
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/packages`, productRoutes);
app.use(`${apiPrefix}/bundles`, productRoutes);

// Campaign & Promo
app.use(`${apiPrefix}/campaigns`, campaignRoutes);
app.use(`${apiPrefix}/promos`, campaignRoutes);
app.use(`${apiPrefix}/coupons`, campaignRoutes);

// Loyalty & Rewards
app.use(`${apiPrefix}/members`, loyaltyRoutes);
app.use(`${apiPrefix}/tiers`, loyaltyRoutes);
app.use(`${apiPrefix}/rewards`, loyaltyRoutes);

// Analytics
app.use(`${apiPrefix}/analytics`, analyticsRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
  console.log(`📚 API Prefix: ${apiPrefix}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV}`);
});

export default app;
