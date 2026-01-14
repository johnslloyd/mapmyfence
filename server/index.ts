import 'dotenv/config';
import { DatabaseStorage } from "./storage";
import express, { type Request, Response, NextFunction } from "express";
import { serveStatic } from "./static";
import { createServer } from "http";
import { passport } from './auth';
import { authRouter } from './authRoutes';
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import session from "express-session";

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);
const httpServer = createServer(app);

// Log startup time to verify new build is running
console.log(`[Startup] Server starting at ${new Date().toISOString()}`);

// Check for database configuration to catch common startup issues
if (!process.env.DATABASE_URL) {
  console.warn("[Startup] WARNING: DATABASE_URL is not set. Database operations will fail.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  // Set a permissive CSP to allow Vite, Maps, and other scripts to run.
  // If you are using Helmet in your routes, ensure it is configured to allow this or disabled.
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
  );
  next();
});

// Setup Session and Passport
app.use(session({
  secret: process.env.SESSION_SECRET || "secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

(async () => {
  app.use(authRouter);

  app.get("/version", (_req, res) => {
    res.json({ version: "3.6", status: "Verbose Path Debugging" });
  });

  const storage = new DatabaseStorage(db);
  await registerRoutes(httpServer, app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Handle Zod validation errors
    if (err.name === 'ZodError' && err.errors && err.errors.length > 0) {
      message = err.errors[0].message || "Validation error";
    }

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    // Serve index.html for all non-API, non-static routes (SPA Fallback)
    // This allows us to strip any strict CSP meta tags injected by the build process
    app.use((req, res, next) => {
      if (req.path.startsWith("/api") || path.extname(req.path)) {
        return next();
      }

      console.log(`[CSP Debug] Intercepting request for: ${req.path}`);

      const potentialPaths = [
        path.join(process.cwd(), "dist/public/index.html"),
        path.join(process.cwd(), "dist/index.html"),
        path.join(__dirname, "public/index.html"), // Look relative to dist/index.cjs
        path.join(__dirname, "../dist/public/index.html"), // Fallback
      ];

      for (const indexPath of potentialPaths) {
        console.log(`[CSP] Checking path: ${indexPath}`);
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, "utf-8");
          
          // Debug: Log that we found the file so we know the interceptor is working
          console.log(`[CSP] Found index.html at: ${indexPath}`);

          const before = html.length;
          // Broader regex: Match ANY meta tag that contains "Content-Security-Policy"
          html = html.replace(/<meta[\s\S]*?Content-Security-Policy[\s\S]*?>/gi, "");
          
          if (html.length !== before) {
            console.log("[CSP] Successfully stripped strict meta tag.");
          }

          // Force permissive CSP for the index.html file
          res.removeHeader("Content-Security-Policy");
          res.removeHeader("Content-Security-Policy-Report-Only");
          res.removeHeader("X-Content-Security-Policy");
          res.removeHeader("X-WebKit-CSP");

          const headers = {
            "Content-Type": "text/html",
            "Cache-Control": "no-cache, no-store",
            "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; font-src * data: blob: 'unsafe-inline'; worker-src * data: blob: 'unsafe-inline' 'unsafe-eval';",
            "Content-Length": String(Buffer.byteLength(html)),
          };
          res.writeHead(200, headers);
          return res.end(html);
        }
      }
      console.log("[CSP] WARNING: No index.html found in potential paths. Serving default static.");
      next();
    });
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5050", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0", // use this for hosting on VPS server
      // host: "127.0.0.1", // use this for local server on mac
      reusePort: true,  //use this for hosting on VP, bit comment out for local hosting on mac
    },
    () => {
      console.log(`serving on port ${port}`);
    },
  );
})();
