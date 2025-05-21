import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';

// Setup for serverless Neon database
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function updateAdminCredentials() {
  try {
    console.log("Starting admin credential update...");
    
    // Define new credentials
    const newUsername = 'cnelloms';
    const newPassword = 'admin2025';
    
    // Find Chris Nelloms' user account (the global admin)
    const adminUserResults = await db.select()
      .from(schema.users)
      .where(user => user.isAdmin.equals(true))
      .limit(10);
    
    console.log(`Found ${adminUserResults.length} admin users`);
    
    // Find the main admin user (Chris Nelloms)
    const chrisUser = adminUserResults.find(user => 
      user.id.includes('direct_admin') && 
      (user.firstName?.toLowerCase().includes('chris') || 
       user.lastName?.toLowerCase().includes('nelom'))
    );
    
    if (!chrisUser) {
      console.error("Could not find the global admin user (Chris Nelloms)");
      return;
    }
    
    console.log(`Found global admin: ${chrisUser.firstName} ${chrisUser.lastName} (ID: ${chrisUser.id})`);
    
    // Generate new password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the credentials
    const updateResult = await db.execute(`
      UPDATE credentials
      SET username = $1, 
          password_hash = $2,
          updated_at = NOW()
      WHERE user_id = $3
      RETURNING id
    `, [newUsername, hashedPassword, chrisUser.id]);
    
    if (updateResult.rowCount > 0) {
      console.log("Admin credentials updated successfully!");
      console.log(`New Username: ${newUsername}`);
      console.log(`New Password: ${newPassword}`);
    } else {
      console.log("No credentials were updated. Admin user credentials might not exist.");
      
      // Insert credentials if they don't exist
      console.log("Trying to create new credentials...");
      
      const insertResult = await db.execute(`
        INSERT INTO credentials (user_id, username, password_hash, is_enabled, created_at, updated_at)
        VALUES ($1, $2, $3, true, NOW(), NOW())
        RETURNING id
      `, [chrisUser.id, newUsername, hashedPassword]);
      
      if (insertResult.rowCount > 0) {
        console.log("Admin credentials created successfully!");
        console.log(`Username: ${newUsername}`);
        console.log(`Password: ${newPassword}`);
      } else {
        console.error("Failed to create admin credentials.");
      }
    }
  } catch (error) {
    console.error("Error updating admin credentials:", error);
  } finally {
    await pool.end();
  }
}

// Run the function
updateAdminCredentials().catch(err => {
  console.error("Script execution error:", err);
  process.exit(1);
});