import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the user has admin privileges
 * Used to protect admin-only routes in the API
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if the user exists and has admin privileges
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  // User has admin privileges, proceed
  next();
}

/**
 * Middleware to check for specific employee roles
 * This is complementary to the role middleware that checks roles by name
 */
export function requireEmployeeRole(roleName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check if user has admin access - admins bypass role checks
    if (req.user?.isAdmin) {
      return next();
    }
    
    // Otherwise check for the specific role
    if (!req.user?.roles?.includes(roleName)) {
      return res.status(403).json({ message: `Forbidden: ${roleName} role required` });
    }
    
    next();
  };
}