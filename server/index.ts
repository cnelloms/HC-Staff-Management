import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import loginRouter from "./login-router";
import keyValueRouter from "./key-value-routes";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { isAuthenticated } from "./middleware/auth-middleware";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set trust proxy to handle secure cookies behind Replit's proxy
app.set('trust proxy', 1);

// Set up session middleware with PostgreSQL store
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

// Configure session middleware
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false, // Only save when session is modified
  saveUninitialized: false, // Don't create session until something stored
  name: 'staff_mgmt_sid', // Explicit name for the session cookie
  cookie: {
    secure: app.get('env') === 'production', // Only secure in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer sessions
    sameSite: 'lax',
    path: '/'
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Mount the API routes
app.use('/api/kv', keyValueRouter);
// Change request routes will be mounted in registerRoutes

// Profile endpoint
app.get('/api/profile', isAuthenticated, (req: Request, res: Response) => {
  console.log('PROFILE →', req.user);
  if (!req.user) {
    return res.status(404).json({ message: 'No profile found' });
  }
  
  // Extract only the fields we want to expose
  const user = req.user as any;
  const profile = {
    id: user.id,
    firstName: user.firstName || user.first_name,
    lastName: user.lastName || user.last_name,
    email: user.email,
    isAdmin: user.isAdmin || false,
    isEnabled: user.isEnabled !== undefined ? user.isEnabled : true
  };
  
  return res.json(profile);
});

(async () => {
  const server = await registerRoutes(app);

  // Session is already configured above, removing duplicate code
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
