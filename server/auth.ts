import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import pg from "pg";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Create a PostgreSQL connection pool for sessions
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a PostgreSQL session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({
  pool,
  createTableIfMissing: true
});

// Helper functions for password hashing/comparing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'discount-finder-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware to check if user is authenticated
  const isAuthenticated = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, username: user.username });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Don't return the password hash to the client
    const { password, ...user } = req.user as Express.User;
    res.json(user);
  });

  // Add admin-specific routes
  app.post("/api/admin/offers", isAuthenticated, async (req, res, next) => {
    try {
      const offer = await storage.createOffer(req.body);
      res.status(201).json(offer);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/offers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const { id } = req.params;
      const offer = await storage.updateOffer(parseInt(id), req.body);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      res.json(offer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/offers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteOffer(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Offer not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return { isAuthenticated };
}