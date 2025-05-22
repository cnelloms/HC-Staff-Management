import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { employeeRoles, roles } from "@shared/schema";
import { eq } from "drizzle-orm";
import 'express-session';

// Add roles property for type checking
declare module 'express' {
  interface Request {
    user?: {
      id?: string;
      username?: string;
      email?: string;
      isAdmin?: boolean;
      employeeId?: number;
      roles?: string[];
    };
  }
}

/** fetch role names for a user */
async function fetchRoles(employeeId: number) {
  const rows = await db
    .select({ name: roles.name })
    .from(employeeRoles)
    .leftJoin(roles, eq(employeeRoles.roleId, roles.id))
    .where(eq(employeeRoles.employeeId, employeeId));
  return rows.map(r => r.name).filter((name): name is string => name !== null);
}

/** middleware that injects req.user.roles */
export async function enrichRoles(req: Request, _res: Response, next: NextFunction) {
  if (req.user && !req.user.roles && req.user.employeeId) {
    const roleNames = await fetchRoles(req.user.employeeId);
    req.user.roles = roleNames;
  }
  next();
}

/** guard factory */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for admin status in multiple places
    // 1. In the req.user object (Replit auth)
    // 2. In the session (direct auth)
    if (req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true) {
      return next();
    }
    
    // Otherwise check for the specific role
    if (!req.user?.roles?.includes(role)) {
      return res.status(403).json({ message: `Required role '${role}' is missing` });
    }
    next();
  };
}