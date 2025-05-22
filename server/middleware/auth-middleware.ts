import { Request, Response, NextFunction } from 'express';
import { isReplitAuthenticated } from '../replitAuth';
import { isMicrosoftAuthenticated } from '../microsoftAuth';
import { isAuthenticatedWithDirect, isAdmin as isDirectAdmin } from '../directAuth';

/**
 * Unified authentication middleware
 * Checks all authentication methods and proceeds if any are valid
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Check if user is directly authenticated via direct auth
  if (req.session?.directUser?.id) {
    return isAuthenticatedWithDirect(req, res, next);
  }
  
  // Check if user is authenticated via Microsoft
  if (req.session?.microsoftUser?.idToken) {
    return isMicrosoftAuthenticated(req, res, next);
  }
  
  // Check if user is authenticated via Replit
  if (req.isAuthenticated() && req.user) {
    return isReplitAuthenticated(req, res, next);
  }
  
  // No valid authentication found
  return res.status(401).json({ message: "Unauthorized" });
};

/**
 * Unified admin check middleware
 * Checks if the user is an admin through any authentication method
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // First ensure the user is authenticated
  isAuthenticated(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }
    
    // Check if admin via direct auth
    if (req.session?.directUser?.isAdmin) {
      return next();
    }
    
    // Check if admin via Replit auth
    if (req.isAuthenticated() && (req.user as any)?.isAdmin) {
      return next();
    }
    
    // No admin privileges found
    return res.status(403).json({ message: "Admin access required" });
  });
};