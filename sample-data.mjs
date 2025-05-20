// A simple script to generate sample data for the HR system
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

// Configure the database connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createSampleData() {
  console.log("Creating sample data for the HR system...");
  
  try {
    // 1. Create some additional users with different roles (with unique timestamps to avoid duplicates)
    const timestamp = Date.now();
    const users = [
      { username: 'jsmith', firstName: 'John', lastName: 'Smith', email: `john.smith.${timestamp}@example.com`, isAdmin: false },
      { username: 'mwilliams', firstName: 'Maria', lastName: 'Williams', email: `maria.williams.${timestamp}@example.com`, isAdmin: false },
      { username: 'rjohnson', firstName: 'Robert', lastName: 'Johnson', email: `robert.johnson.${timestamp}@example.com`, isAdmin: false },
      { username: 'jdoe', firstName: 'Jane', lastName: 'Doe', email: `jane.doe.${timestamp}@example.com`, isAdmin: true }
    ];
    
    console.log("Creating users...");
    for (const user of users) {
      // Create a user ID
      const userId = `direct_${user.username}_${Date.now()}`;
      
      // First create the user entry
      const userResult = await pool.query(
        `INSERT INTO users (id, first_name, last_name, email, is_admin, auth_provider)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [userId, user.firstName, user.lastName, user.email, user.isAdmin, 'direct']
      );
      
      if (userResult.rows.length > 0) {
        // Now create credentials with a default password of "password123"
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        
        await pool.query(
          `INSERT INTO credentials (user_id, username, password_hash, is_enabled)
           VALUES ($1, $2, $3, $4)`,
          [userId, user.username, passwordHash, true]
        );
        
        console.log(`Created user: ${user.firstName} ${user.lastName} (${user.username})`);
      } else {
        console.log(`User ${user.username} already exists, skipping...`);
      }
    }
    
    // 2. Create some departments if they don't exist
    const departments = [
      { name: 'IT Department', description: 'Information Technology' },
      { name: 'Human Resources', description: 'HR Department' },
      { name: 'Finance', description: 'Financial Operations' },
      { name: 'Marketing', description: 'Marketing and Communications' },
      { name: 'Operations', description: 'Business Operations' },
      { name: 'Sales', description: 'Sales and Business Development' }
    ];
    
    console.log("Creating departments...");
    for (const dept of departments) {
      await pool.query(
        `INSERT INTO departments (name, description)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [dept.name, dept.description]
      );
      console.log(`Created department: ${dept.name}`);
    }
    
    // 3. Add positions for the departments
    console.log("Creating positions...");
    // Get all departments
    const deptResult = await pool.query('SELECT * FROM departments');
    
    for (const dept of deptResult.rows) {
      // Create director position
      await pool.query(
        `INSERT INTO positions (title, department_id, description)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [`${dept.name} Director`, dept.id, `Director of ${dept.name}`]
      );
      
      // Create manager position
      await pool.query(
        `INSERT INTO positions (title, department_id, description)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [`${dept.name} Manager`, dept.id, `Manager in ${dept.name}`]
      );
      
      // Create specialist position
      await pool.query(
        `INSERT INTO positions (title, department_id, description)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [`${dept.name} Specialist`, dept.id, `Specialist in ${dept.name}`]
      );
      
      console.log(`Created positions for ${dept.name}`);
    }
    
    // 4. Create some employees
    console.log("Creating employees...");
    
    // Get all positions
    const posResult = await pool.query('SELECT * FROM positions');
    const positions = posResult.rows;
    
    // Helper function to get random elements
    const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
    
    // Create 50 sample employees with structured reporting lines
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    // First create directors
    const directors = {};
    
    for (const dept of deptResult.rows) {
      const directorPosition = positions.find(p => p.title === `${dept.name} Director`);
      
      if (directorPosition) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@example.com`;
        const phone = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        
        const result = await pool.query(
          `INSERT INTO employees (first_name, last_name, email, department_id, position, status, hire_date, phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [firstName, lastName, email, dept.id, directorPosition.title, 'Active', new Date(2018, 0, 1), phone]
        );
        
        directors[dept.id] = result.rows[0];
        console.log(`Created director: ${firstName} ${lastName} for ${dept.name}`);
      }
    }
    
    // Then create managers reporting to directors
    const managers = {};
    
    for (const dept of deptResult.rows) {
      const managerPosition = positions.find(p => p.title === `${dept.name} Manager`);
      const director = directors[dept.id];
      
      if (managerPosition && director) {
        managers[dept.id] = [];
        
        // Create 1-2 managers per department
        const managerCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < managerCount; i++) {
          const firstName = getRandomElement(firstNames);
          const lastName = getRandomElement(lastNames);
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@example.com`;
          const phone = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
          
          const result = await pool.query(
            `INSERT INTO employees (first_name, last_name, email, department_id, position, manager_id, status, hire_date, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [firstName, lastName, email, dept.id, managerPosition.title, director.id, 'Active', new Date(2019, 0, 1), phone]
          );
          
          managers[dept.id].push(result.rows[0]);
          console.log(`Created manager: ${firstName} ${lastName} for ${dept.name}`);
        }
      }
    }
    
    // Finally create regular employees reporting to managers
    for (const dept of deptResult.rows) {
      const specialistPosition = positions.find(p => p.title === `${dept.name} Specialist`);
      const deptManagers = managers[dept.id] || [];
      const director = directors[dept.id];
      
      if (specialistPosition) {
        // Create 3-5 specialists per department
        const specialistCount = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < specialistCount; i++) {
          const firstName = getRandomElement(firstNames);
          const lastName = getRandomElement(lastNames);
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now() + i}@example.com`;
          const phone = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
          
          // 80% report to a manager, 20% to the director
          const manager = deptManagers.length > 0 && Math.random() < 0.8
            ? getRandomElement(deptManagers)
            : director;
          
          if (manager) {
            await pool.query(
              `INSERT INTO employees (first_name, last_name, email, department_id, position, manager_id, status, hire_date, phone)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [firstName, lastName, email, dept.id, specialistPosition.title, manager.id, 
               Math.random() < 0.9 ? 'Active' : 'On Leave', // 10% on leave
               new Date(2020 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1),
               phone]
            );
          }
        }
        
        console.log(`Created ${specialistCount} specialists for ${dept.name}`);
      }
    }
    
    // Count total employees
    const countResult = await pool.query('SELECT COUNT(*) FROM employees');
    const totalEmployees = parseInt(countResult.rows[0].count);
    
    console.log("Sample data creation complete!");
    console.log(`Total employees: ${totalEmployees}`);
    console.log("You can now log in with any of these users:");
    console.log("- admin / admin123 (System Administrator)");
    console.log("- jsmith / password123 (Regular user)");
    console.log("- mwilliams / password123 (Regular user)");
    console.log("- rjohnson / password123 (Regular user)");
    console.log("- jdoe / password123 (Administrator)");
    
  } catch (error) {
    console.error("Error creating sample data:", error);
  } finally {
    await pool.end();
  }
}

// Run the sample data creation
createSampleData();