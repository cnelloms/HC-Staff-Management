import { db } from './db';
import { keyValueStore, InsertKeyValueStore, KeyValueStore } from '@shared/schema';
import { eq, and, isNull, lt, inArray } from 'drizzle-orm';

// Key-value store namespaces
export const KV_NAMESPACE = {
  USER_PREFERENCES: 'user_preferences',
  APP_CONFIG: 'app_config',
  ANNOUNCEMENTS: 'announcements', 
  SESSION_DATA: 'session_data',
  CACHE: 'cache'
};

/**
 * Service for managing the key-value store
 */
export class KeyValueService {
  /**
   * Store a value in the key-value store
   */
  async set(namespace: string, key: string, value: any, options?: { 
    userId?: string, 
    expiresAt?: Date,
    overwrite?: boolean
  }): Promise<KeyValueStore> {
    const { userId, expiresAt, overwrite = true } = options || {};
    
    // Check if key exists (for insert vs update decision)
    const existingEntry = await this.get(namespace, key, userId);
    
    if (existingEntry && !overwrite) {
      return existingEntry;
    }
    
    // Create insert data
    const data: InsertKeyValueStore = {
      namespace,
      key,
      value,
      userId,
      expiresAt
    };
    
    if (existingEntry) {
      // Update existing entry
      const [updated] = await db.update(keyValueStore)
        .set({
          value,
          expiresAt,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(keyValueStore.namespace, namespace),
            eq(keyValueStore.key, key),
            userId 
              ? eq(keyValueStore.userId, userId)
              : isNull(keyValueStore.userId)
          )
        )
        .returning();
        
      return updated;
    } else {
      // Insert new entry
      const [created] = await db.insert(keyValueStore)
        .values(data)
        .returning();
        
      return created;
    }
  }
  
  /**
   * Get a value from the key-value store
   */
  async get<T = any>(namespace: string, key: string, userId?: string): Promise<T | null> {
    // Clean up expired entries before querying
    await this.cleanupExpired();
    
    // Build query conditions
    const conditions = [
      eq(keyValueStore.namespace, namespace),
      eq(keyValueStore.key, key)
    ];
    
    if (userId) {
      conditions.push(eq(keyValueStore.userId, userId));
    } else {
      conditions.push(isNull(keyValueStore.userId));
    }
    
    // Get the value
    const [entry] = await db.select()
      .from(keyValueStore)
      .where(and(...conditions));
      
    return entry ? entry.value as T : null;
  }
  
  /**
   * Delete a value from the key-value store
   */
  async delete(namespace: string, key: string, userId?: string): Promise<boolean> {
    const result = await db.delete(keyValueStore)
      .where(
        and(
          eq(keyValueStore.namespace, namespace),
          eq(keyValueStore.key, key),
          userId 
            ? eq(keyValueStore.userId, userId)
            : isNull(keyValueStore.userId)
        )
      );
      
    return true;
  }
  
  /**
   * Get all keys for a namespace
   */
  async getKeys(namespace: string, userId?: string): Promise<string[]> {
    // Clean up expired entries before querying
    await this.cleanupExpired();
    
    // Build query conditions
    const conditions = [
      eq(keyValueStore.namespace, namespace)
    ];
    
    if (userId) {
      conditions.push(eq(keyValueStore.userId, userId));
    } else {
      conditions.push(isNull(keyValueStore.userId));
    }
    
    // Get the keys
    const entries = await db.select({ key: keyValueStore.key })
      .from(keyValueStore)
      .where(and(...conditions));
      
    return entries.map(entry => entry.key);
  }
  
  /**
   * Get all entries for a namespace
   */
  async getAll<T = any>(namespace: string, userId?: string): Promise<Record<string, T>> {
    // Clean up expired entries before querying
    await this.cleanupExpired();
    
    // Build query conditions
    const conditions = [
      eq(keyValueStore.namespace, namespace)
    ];
    
    if (userId) {
      conditions.push(eq(keyValueStore.userId, userId));
    } else {
      conditions.push(isNull(keyValueStore.userId));
    }
    
    // Get all entries
    const entries = await db.select()
      .from(keyValueStore)
      .where(and(...conditions));
      
    // Convert to record
    const result: Record<string, T> = {};
    for (const entry of entries) {
      result[entry.key] = entry.value as T;
    }
    
    return result;
  }
  
  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<void> {
    const now = new Date();
    
    await db.delete(keyValueStore)
      .where(
        and(
          eq(isNull(keyValueStore.expiresAt), false),
          lt(keyValueStore.expiresAt as any, now)
        )
      );
  }
  
  /**
   * Clear all entries for a namespace
   */
  async clearNamespace(namespace: string, userId?: string): Promise<void> {
    const conditions = [
      eq(keyValueStore.namespace, namespace)
    ];
    
    if (userId) {
      conditions.push(eq(keyValueStore.userId, userId));
    }
    
    await db.delete(keyValueStore)
      .where(and(...conditions));
  }
  
  // Feature 1: User Preferences
  async getUserPreference<T = any>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(KV_NAMESPACE.USER_PREFERENCES, key, userId);
  }
  
  async setUserPreference<T = any>(userId: string, key: string, value: T): Promise<KeyValueStore> {
    return this.set(KV_NAMESPACE.USER_PREFERENCES, key, value, { userId });
  }
  
  async getAllUserPreferences<T = any>(userId: string): Promise<Record<string, T>> {
    return this.getAll<T>(KV_NAMESPACE.USER_PREFERENCES, userId);
  }
  
  // Feature 2: Application Configuration
  async getAppConfig<T = any>(key: string): Promise<T | null> {
    return this.get<T>(KV_NAMESPACE.APP_CONFIG, key);
  }
  
  async setAppConfig<T = any>(key: string, value: T): Promise<KeyValueStore> {
    return this.set(KV_NAMESPACE.APP_CONFIG, key, value);
  }
  
  async getAllAppConfig<T = any>(): Promise<Record<string, T>> {
    return this.getAll<T>(KV_NAMESPACE.APP_CONFIG);
  }
  
  // Feature 3: System Announcements
  async getAnnouncement(key: string): Promise<{ 
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'success' | 'error',
    dismissible: boolean,
    link?: { url: string, text: string }
  } | null> {
    return this.get(KV_NAMESPACE.ANNOUNCEMENTS, key);
  }
  
  async setAnnouncement(
    key: string, 
    announcement: { 
      title: string, 
      message: string, 
      type: 'info' | 'warning' | 'success' | 'error',
      dismissible: boolean,
      expiresAt?: Date,
      link?: { url: string, text: string }
    }
  ): Promise<KeyValueStore> {
    return this.set(
      KV_NAMESPACE.ANNOUNCEMENTS, 
      key, 
      announcement, 
      { expiresAt: announcement.expiresAt }
    );
  }
  
  async getAllAnnouncements(): Promise<Record<string, {
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'success' | 'error',
    dismissible: boolean,
    link?: { url: string, text: string }
  }>> {
    return this.getAll(KV_NAMESPACE.ANNOUNCEMENTS);
  }
  
  async removeAnnouncement(key: string): Promise<boolean> {
    return this.delete(KV_NAMESPACE.ANNOUNCEMENTS, key);
  }
  
  // Feature 4: Session Data (temporary user-specific data)
  async getSessionData<T = any>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(KV_NAMESPACE.SESSION_DATA, key, userId);
  }
  
  async setSessionData<T = any>(
    userId: string, 
    key: string, 
    value: T, 
    expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours by default
  ): Promise<KeyValueStore> {
    const expiresAt = new Date(Date.now() + expiresIn);
    return this.set(KV_NAMESPACE.SESSION_DATA, key, value, { userId, expiresAt });
  }
  
  async getAllSessionData<T = any>(userId: string): Promise<Record<string, T>> {
    return this.getAll<T>(KV_NAMESPACE.SESSION_DATA, userId);
  }
  
  async clearUserSessionData(userId: string): Promise<void> {
    return this.clearNamespace(KV_NAMESPACE.SESSION_DATA, userId);
  }
  
  // Feature 5: Cached Reference Data
  async getCachedData<T = any>(key: string): Promise<T | null> {
    return this.get<T>(KV_NAMESPACE.CACHE, key);
  }
  
  async setCachedData<T = any>(
    key: string, 
    value: T, 
    expiresIn: number = 60 * 60 * 1000 // 1 hour by default
  ): Promise<KeyValueStore> {
    const expiresAt = new Date(Date.now() + expiresIn);
    return this.set(KV_NAMESPACE.CACHE, key, value, { expiresAt });
  }
  
  async invalidateCache(keys?: string[]): Promise<void> {
    if (keys && keys.length > 0) {
      await db.delete(keyValueStore)
        .where(
          and(
            eq(keyValueStore.namespace, KV_NAMESPACE.CACHE),
            inArray(keyValueStore.key, keys)
          )
        );
    } else {
      await this.clearNamespace(KV_NAMESPACE.CACHE);
    }
  }
}

// Export a singleton instance
export const kvService = new KeyValueService();