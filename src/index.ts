import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));





// Routes
app.use('/api/auth', authRoutes);


app.use('/api/appointments', appointmentRoutes);





// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully',
      time: result
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'HVAC Service API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      testDb: 'GET /test-db',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Protected)'
      }
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});