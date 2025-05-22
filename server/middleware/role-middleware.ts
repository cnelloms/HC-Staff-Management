import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { employeeRoles, roles } from "@shared/schema";
import { eq } from "drizzle-orm";

/** fetch role names for a user */
async function fetchRoles(employeeId: number) {
  const rows = await db
    .select({ name: roles.name })
    .from(employeeRoles)
    .leftJoin(roles, eq(employeeRoles.roleId, roles.id))
    .where(eq(employeeRoles.employeeId, employeeId));
  return rows.map(r => r.name);
}

/** middleware that injects req.user.roles */
export async function enrichRoles(req: Request, _res: Response, next: NextFunction) {
  if (req.user && !req.user.roles) {
    req.user.roles = await fetchRoles(req.user.id);
  }
  next();
}

/** guard factory */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles?.includes(role)) return res.sendStatus(403);
    next();
  };
}