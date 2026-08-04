import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import prisma from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import appointmentRoutes from "./routes/appointment.routes";
import faqRoutes from "./routes/faq.routes";
import aboutUsStoryRoutes from "./routes/aboutUsStory.routes";
import passwordResetRoutes from './routes/passwordReset.routes';
import companySettingsRoutes from './routes/companySettings.routes';
import chatRoutes from './routes/chat.routes';
import dashboardRoutes from './routes/dashboard.routes';
import blogRoutes from './routes/blog.routes';
import hvacEstimateRoutes from './routes/hvacEstimate.routes';


// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE - Order matters!
// ============================================================

// 1. CORS (ONCE, with proper configuration)
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

// 2. Body parsers (ONCE, with increased limit)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Cookie parser
app.use(cookieParser());

// 4. Security & logging
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(morgan("dev"));

// ============================================================
// ROUTES
// ============================================================

// Auth routes
app.use("/api/auth", authRoutes);
app.use('/api/auth', passwordResetRoutes);

// Appointments
app.use("/api/appointments", appointmentRoutes);

// FAQ
app.use("/api/faqs", faqRoutes);

// About Us
app.use("/api/about-us/story", aboutUsStoryRoutes);

// Company Settings
app.use("/api/company-settings", companySettingsRoutes);

// Chatbot
app.use('/api/chat', chatRoutes);

// Dashboard
app.use('/api/dashboard', dashboardRoutes);

// Blogs
app.use('/api/blogs', blogRoutes);

// estimate quote servicev
app.use('/api/hvac-estimate', hvacEstimateRoutes);

console.log('✅ All routes registered');

// ============================================================
// HEALTH & TEST ENDPOINTS
// ============================================================

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Test database connection
app.get("/test-db", async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    res.status(200).json({
      status: "success",
      message: "Database connected successfully",
      time: result,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "HVAC Service API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      testDb: "GET /test-db",
      auth: {
        login: "POST /api/auth/login",
        me: "GET /api/auth/me (Protected)",
      },
      appointments: {
        create: "POST /api/appointments (Public)",
        getAll: "GET /api/appointments (Protected)",
        getById: "GET /api/appointments/:id (Protected)",
        updateStatus: "PATCH /api/appointments/:id/status (Protected)",
        dashboard: "GET /api/appointments/dashboard/stats (Protected)",
      },
      faqs: {
        getAll: "GET /api/faqs (Public)",
        getById: "GET /api/faqs/:id (Public)",
        create: "POST /api/faqs (Protected)",
        update: "PUT /api/faqs/:id (Protected)",
        delete: "DELETE /api/faqs/:id (Protected)",
        bulkOrder: "PATCH /api/faqs/bulk-order (Protected)",
      },
      blogs: {
        getAll: "GET /api/blogs (Public)",
        getById: "GET /api/blogs/:slug (Public)",
        create: "POST /api/blogs (Protected)",
        update: "PUT /api/blogs/:id (Protected)",
        delete: "DELETE /api/blogs/:id (Protected)",
        categories: "GET /api/blogs/categories (Public)",
      },
      dashboard: {
        get: "GET /api/dashboard (Protected)",
      },
    },
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});