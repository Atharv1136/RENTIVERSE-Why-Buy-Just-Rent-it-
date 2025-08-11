import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User, registerSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      password: string;
      fullName: string;
      phone?: string | null;
      role: "customer" | "admin";
      isEmailVerified: boolean;
      emailVerificationOtp?: string | null;
      otpExpiresAt?: Date | null;
      createdAt: Date;
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
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
        if (!user) {
          return done(null, false);
        }

        if (!user.isEmailVerified) {
          return done(null, false, { message: 'Please verify your email first' });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register route - direct registration without OTP
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        isEmailVerified: true // Auto-verify since we removed OTP
      });

      // Auto-login the user after registration
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Registration successful but login failed" });
        res.status(201).json({
          message: "Registration successful!",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        });
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // OTP routes removed - direct authentication without email verification

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json({
      message: "Login successful",
      user: {
        id: req.user!.id,
        username: req.user!.username,
        email: req.user!.email,
        fullName: req.user!.fullName,
        role: req.user!.role
      }
    });
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json({
      id: req.user!.id,
      username: req.user!.username,
      email: req.user!.email,
      fullName: req.user!.fullName,
      role: req.user!.role
    });
  });
}
