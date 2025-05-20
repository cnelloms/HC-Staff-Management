import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import bcrypt from 'bcryptjs';
import * as schema from './shared/schema.js';

// Use WebSocket for Neon connection
neonConfig.webSocketConstructor = ws;

// Make sure we have a database URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for setting up admin user");
}

// Set up the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function setupAdminUser() {
  try {
    console.log("Setting up admin user and initial authentication settings...");

    // Check if auth settings table already exists and has entries
    const authSettings = await db.query.authSettings.findMany({
      limit: 1,
    });

    if (authSettings.length === 0) {
      console.log("Creating initial auth settings...");
      await db.insert(schema.authSettings).values({
        directLoginEnabled: true,
        microsoftLoginEnabled: false,
        replitLoginEnabled: true,
      });
    } else {
      console.log("Auth settings already exist.");
    }

    // Check if admin user credentials already exist
    const adminCredentials = await db.query.credentials.findMany({
      where: (credentials, { eq }) => eq(credentials.username, 'admin'),
      limit: 1,
    });

    if (adminCredentials.length === 0) {
      console.log("Creating admin user...");
      
      // Create the admin user
      const adminUser = await db.insert(schema.users).values({
        id: `direct_admin_${Date.now()}`,
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@example.com',
        authProvider: 'direct',
        isAdmin: true
      }).returning();

      // Hash the password (default: 'admin123')
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin credentials
      await db.insert(schema.credentials).values({
        userId: adminUser[0].id,
        username: 'admin',
        password: hashedPassword,
        isEnabled: true
      });
      
      console.log("Admin user created successfully!");
      console.log("Username: admin");
      console.log("Password: admin123");
    } else {
      console.log("Admin user already exists.");
    }

    console.log("Setup completed successfully!");
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    await pool.end();
  }
}

setupAdminUser();