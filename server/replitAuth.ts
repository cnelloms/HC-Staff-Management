import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.REPLIT_DOMAINS) {
  console.log("Replit domains not set. Replit authentication will be disabled.");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "staff-management-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
    name: "staff_mgmt_sid"
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function findOrCreateUser(claims: any) {
  // Check if user already exists by email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, claims.email))
    .limit(1);

  if (existingUser) {
    // Update Replit-specific fields if needed
    return existingUser;
  }

  // Create a new user with Replit info
  const [newUser] = await db
    .insert(users)
    .values({
      id: `replit_${claims.sub}`,
      firstName: claims.first_name || claims.given_name || "Replit",
      lastName: claims.last_name || claims.family_name || "User",
      email: claims.email,
      authProvider: "replit",
      isAdmin: false // New users are not admins by default
    })
    .returning();

  return newUser;
}

export async function setupReplitAuth(app: Express) {
  if (!process.env.REPLIT_DOMAINS) {
    console.log("Replit authentication is disabled");
    return;
  }

  console.log("Setting up Replit authentication...");
  app.set("trust proxy", 1);
  
  // Use the shared session middleware
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      
      const userClaims = tokens.claims();
      const dbUser = await findOrCreateUser(userClaims);
      
      // Add database user info to session
      (user as any).id = dbUser.id;
      (user as any).email = dbUser.email;
      (user as any).isAdmin = dbUser.isAdmin;
      (user as any).firstName = dbUser.firstName;
      (user as any).lastName = dbUser.lastName;
      (user as any).employeeId = await getEmployeeIdForUser(dbUser.id);
      
      verified(null, user);
    } catch (error) {
      console.error("Error during Replit authentication:", error);
      verified(error as Error);
    }
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/replit/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Setup Replit auth routes
  app.get("/api/replit/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/replit/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login",
    })(req, res, next);
  });

  app.get("/api/replit/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
      }
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

// Helper to get employee ID for a user
async function getEmployeeIdForUser(userId: string): Promise<number | null> {
  try {
    const result = await db.execute<{id: number}>(
      `SELECT id FROM employees WHERE email = (SELECT email FROM users WHERE id = $1) LIMIT 1`, 
      [userId]
    );
    
    if (result && result.length > 0) {
      return result[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error fetching employee ID:", error);
    return null;
  }
}

export const isReplitAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  if (!user.expires_at) {
    return res.status(401).json({ message: "Session expired, please login again" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/replit/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.redirect("/api/replit/login");
  }
};