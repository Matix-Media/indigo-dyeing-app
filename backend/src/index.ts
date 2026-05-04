import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Routes
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
import designRoutes from "./routes/designs.js";
import reviewRoutes from "./routes/reviews.js";
import webhookRoutes from "./routes/webhooks.js";
import workshopRoutes from "./routes/workshops.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Trust the nginx reverse proxy so that rate limiting works by real client IP
app.set("trust proxy", 1);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "500"),
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "200"),
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    }),
);

// Webhook route with raw body (before JSON parsing)
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// Parse JSON for other routes
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Health check
app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date() });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
