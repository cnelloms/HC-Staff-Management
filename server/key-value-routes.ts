import express, { Request, Response } from 'express';
import { kvService, KV_NAMESPACE } from './key-value-service';
import { isAuthenticatedWithDirect as isAuthenticated, isAdmin } from './directAuth';

const router = express.Router();

// Middleware to validate namespace
const validateNamespace = (req: Request, res: Response, next: Function) => {
  const { namespace } = req.params;
  const validNamespaces = Object.values(KV_NAMESPACE);
  
  if (!validNamespaces.includes(namespace)) {
    return res.status(400).json({
      message: `Invalid namespace. Must be one of: ${validNamespaces.join(', ')}`
    });
  }
  
  next();
};

// Get all keys for a namespace
router.get('/namespaces/:namespace/keys', isAuthenticated, validateNamespace, async (req: Request, res: Response) => {
  try {
    const { namespace } = req.params;
    // For user-specific namespaces, require userId
    const userId = (req as any).directUser?.id;
    
    if ((namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA) && !userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only include userId for user-specific namespaces
    const useUserId = namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA;
    
    const keys = await kvService.getKeys(namespace, useUserId ? userId : undefined);
    return res.json(keys);
  } catch (error) {
    console.error(`Error fetching keys for namespace:`, error);
    return res.status(500).json({ message: 'Failed to fetch keys' });
  }
});

// Get all entries for a namespace
router.get('/namespaces/:namespace', isAuthenticated, validateNamespace, async (req: Request, res: Response) => {
  try {
    const { namespace } = req.params;
    const userId = (req as any).directUser?.id;
    
    if ((namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA) && !userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only include userId for user-specific namespaces
    const useUserId = namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA;
    
    const entries = await kvService.getAll(namespace, useUserId ? userId : undefined);
    return res.json(entries);
  } catch (error) {
    console.error(`Error fetching entries for namespace:`, error);
    return res.status(500).json({ message: 'Failed to fetch entries' });
  }
});

// Get a specific value
router.get('/namespaces/:namespace/keys/:key', isAuthenticated, validateNamespace, async (req: Request, res: Response) => {
  try {
    const { namespace, key } = req.params;
    const userId = (req as any).directUser?.id;
    
    if ((namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA) && !userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only include userId for user-specific namespaces
    const useUserId = namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA;
    
    const value = await kvService.get(namespace, key, useUserId ? userId : undefined);
    
    if (value === null) {
      return res.status(404).json({ message: 'Key not found' });
    }
    
    return res.json(value);
  } catch (error) {
    console.error(`Error fetching value:`, error);
    return res.status(500).json({ message: 'Failed to fetch value' });
  }
});

// Set a value
router.post('/namespaces/:namespace/keys/:key', isAuthenticated, validateNamespace, async (req: Request, res: Response) => {
  try {
    const { namespace, key } = req.params;
    const { value, expiresIn } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }
    
    const userId = (req as any).directUser?.id;
    
    if ((namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA) && !userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only include userId for user-specific namespaces
    const useUserId = namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA;
    
    // Calculate expiration time if specified
    let expiresAt: Date | undefined = undefined;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn);
    }
    
    const result = await kvService.set(
      namespace, 
      key, 
      value, 
      { 
        userId: useUserId ? userId : undefined,
        expiresAt
      }
    );
    
    return res.json(result);
  } catch (error) {
    console.error(`Error setting value:`, error);
    return res.status(500).json({ message: 'Failed to set value' });
  }
});

// Delete a value
router.delete('/namespaces/:namespace/keys/:key', isAuthenticated, validateNamespace, async (req: Request, res: Response) => {
  try {
    const { namespace, key } = req.params;
    const userId = (req as any).directUser?.id;
    
    if ((namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA) && !userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only include userId for user-specific namespaces
    const useUserId = namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA;
    
    await kvService.delete(namespace, key, useUserId ? userId : undefined);
    
    return res.json({ message: 'Value deleted successfully' });
  } catch (error) {
    console.error(`Error deleting value:`, error);
    return res.status(500).json({ message: 'Failed to delete value' });
  }
});

// Clear a namespace
router.delete('/namespaces/:namespace', isAuthenticated, validateNamespace, async (req: Request, res: Response) => {
  try {
    const { namespace } = req.params;
    const userId = (req as any).directUser?.id;
    
    if ((namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA) && !userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only include userId for user-specific namespaces
    const useUserId = namespace === KV_NAMESPACE.USER_PREFERENCES || namespace === KV_NAMESPACE.SESSION_DATA;
    
    await kvService.clearNamespace(namespace, useUserId ? userId : undefined);
    
    return res.json({ message: `Namespace ${namespace} cleared successfully` });
  } catch (error) {
    console.error(`Error clearing namespace:`, error);
    return res.status(500).json({ message: 'Failed to clear namespace' });
  }
});

// Feature 1: User Preferences API
router.get('/preferences', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).directUser?.id;
    
    if (!userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const preferences = await kvService.getAllUserPreferences(userId);
    return res.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({ message: 'Failed to fetch user preferences' });
  }
});

router.get('/preferences/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = (req as any).directUser?.id;
    
    if (!userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const preference = await kvService.getUserPreference(userId, key);
    
    if (preference === null) {
      return res.status(404).json({ message: 'Preference not found' });
    }
    
    return res.json(preference);
  } catch (error) {
    console.error('Error fetching user preference:', error);
    return res.status(500).json({ message: 'Failed to fetch user preference' });
  }
});

router.post('/preferences/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = (req as any).directUser?.id;
    
    if (!userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }
    
    const result = await kvService.setUserPreference(userId, key, value);
    return res.json(result);
  } catch (error) {
    console.error('Error setting user preference:', error);
    return res.status(500).json({ message: 'Failed to set user preference' });
  }
});

// Feature 2: Application Configuration API
router.get('/config', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const config = await kvService.getAllAppConfig();
    return res.json(config);
  } catch (error) {
    console.error('Error fetching app config:', error);
    return res.status(500).json({ message: 'Failed to fetch app config' });
  }
});

router.get('/config/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const config = await kvService.getAppConfig(key);
    
    if (config === null) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    return res.json(config);
  } catch (error) {
    console.error('Error fetching app config:', error);
    return res.status(500).json({ message: 'Failed to fetch app config' });
  }
});

// Feature 3: System Announcements API
router.get('/announcements', async (req: Request, res: Response) => {
  try {
    const announcements = await kvService.getAllAnnouncements();
    return res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

router.get('/announcements/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const announcement = await kvService.getAnnouncement(key);
    
    if (announcement === null) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    return res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return res.status(500).json({ message: 'Failed to fetch announcement' });
  }
});

router.post('/announcements/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Only allow admins to create/update announcements
    const isAdmin = (req as any).directUser?.isAdmin === true;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { key } = req.params;
    const announcement = req.body;
    
    // Validate required fields
    if (!announcement.title || !announcement.message || !announcement.type) {
      return res.status(400).json({ message: 'Title, message, and type are required' });
    }
    
    const result = await kvService.setAnnouncement(key, announcement);
    return res.json(result);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ message: 'Failed to create announcement' });
  }
});

router.delete('/announcements/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Only allow admins to delete announcements
    const isAdmin = (req as any).directUser?.isAdmin === true;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { key } = req.params;
    await kvService.removeAnnouncement(key);
    
    return res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

export default router;