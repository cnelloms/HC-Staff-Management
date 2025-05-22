import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the user has admin privileges
 * Used to protect admin-only routes in the API
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check admin status from multiple authentication methods
  const isDirectAdmin = req.session?.directUser?.isAdmin === true;
  const isReplitAdmin = req.user?.isAdmin === true;
  
  // If admin through any method, proceed
  if (isDirectAdmin || isReplitAdmin) {
    return next();
  }
  
  // No admin privileges found
  return res.status(403).json({ message: 'Forbidden: Admin access required' });
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