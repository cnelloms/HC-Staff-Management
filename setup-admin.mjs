import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import ws from 'ws';

// Use WebSocket for Neon connection
neonConfig.webSocketConstructor = ws;

// Make sure we have a database URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for setting up admin user");
}

// Set up the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupAdminUser() {
  try {
    console.log("Setting up admin user and initial authentication settings...");

    // Check if auth settings table already exists and has entries
    const authSettingsResult = await pool.query(`
      SELECT * FROM auth_settings LIMIT 1
    `);

    if (authSettingsResult.rowCount === 0) {
      console.log("Creating initial auth settings...");
      await pool.query(`
        INSERT INTO auth_settings 
        (direct_login_enabled, microsoft_login_enabled, replit_login_enabled)
        VALUES (true, false, true)
      `);
    } else {
      console.log("Auth settings already exist.");
    }

    // Check if admin user credentials already exist
    const adminCredentialsResult = await pool.query(`
      SELECT * FROM credentials 
      WHERE username = 'admin'
      LIMIT 1
    `);

    if (adminCredentialsResult.rowCount === 0) {
      console.log("Creating admin user...");
      
      // Create the admin user
      const adminId = `direct_admin_${Date.now()}`;
      const adminUserResult = await pool.query(`
        INSERT INTO users
        (id, first_name, last_name, email, auth_provider, is_admin)
        VALUES ($1, 'System', 'Administrator', 'admin@example.com', 'direct', true)
        RETURNING id
      `, [adminId]);

      const userId = adminUserResult.rows[0].id;

      // Hash the password (default: 'admin123')
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin credentials
      await pool.query(`
        INSERT INTO credentials
        (user_id, username, password_hash, is_enabled)
        VALUES ($1, 'admin', $2, true)
      `, [userId, hashedPassword]);
      
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