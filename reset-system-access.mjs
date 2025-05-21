import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

// Load environment variables
config();

async function resetSystemAccess() {
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log('Starting to remove all system access entries...');
    
    // Connect to DB using direct SQL for more reliability in this maintenance script
    // First get count of existing access entries
    const countResult = await pool.query('SELECT COUNT(*) FROM system_access');
    const accessCount = parseInt(countResult.rows[0].count);
    
    console.log(`Found ${accessCount} system access entries to remove`);
    
    // Delete all system access entries
    const deleteResult = await pool.query('DELETE FROM system_access');
    
    console.log('Successfully removed all system access entries');
    console.log('Systems themselves remain in the database for admin management');
    
    // Verify systems still exist
    const systemsResult = await pool.query('SELECT id, name FROM systems');
    const systems = systemsResult.rows;
    
    console.log(`Verified ${systems.length} systems still in database:`);
    systems.forEach(system => {
      console.log(`- ${system.name} (ID: ${system.id})`);
    });
    
    console.log('\nReset complete. System access can now be managed exclusively by administrators.');
  } catch (error) {
    console.error('Error resetting system access:', error);
  } finally {
    // Close the database connection
    await pool.end();
    process.exit(0);
  }
}

resetSystemAccess();