import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Setup for serverless Neon database
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function resetAdminPassword() {
  try {
    console.log('Resetting admin (cnelloms) password...');
    
    // Generate new password hash
    const newPasswordHash = await bcrypt.hash('password', 10);
    console.log('Generated new password hash');
    
    // Update the credentials for the admin user
    const result = await db.execute(`
      UPDATE "credentials" 
      SET "password_hash" = $1, "updated_at" = NOW() 
      WHERE "username" = 'cnelloms'
    `, [newPasswordHash]);
    
    console.log('Password reset completed successfully!');
    console.log('You can now login with:');
    console.log('Username: cnelloms');
    console.log('Password: password');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
resetAdminPassword();