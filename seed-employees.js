// Seed script to generate employees with different reporting structures
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

// Names for random generation
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson'
];

// Department data
const departmentData = [
  { name: 'Information Technology', description: 'IT department responsible for technical infrastructure' },
  { name: 'Human Resources', description: 'Responsible for recruiting and employee relations' },
  { name: 'Finance', description: 'Handles accounting, budgeting, and financial reporting' },
  { name: 'Marketing', description: 'Develops and implements marketing strategies' },
  { name: 'Operations', description: 'Oversees day-to-day business operations' },
  { name: 'Sales', description: 'Handles direct customer sales and account management' },
  { name: 'Research & Development', description: 'Focuses on innovation and product development' },
  { name: 'Customer Support', description: 'Provides assistance and support to customers' }
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startYear = 2015, endYear = 2023) {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month - 1, day);
}

function generateEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
}

function generatePhone() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const firstPart = Math.floor(Math.random() * 900) + 100;
  const secondPart = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${firstPart}-${secondPart}`;
}

async function seedEmployees() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Starting employee seeding process...");
    
    // We need to access the schema tables directly from the database
    // Create departments first
    for (const dept of departmentData) {
      try {
        await pool.query(
          'INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [dept.name, dept.description]
        );
        console.log(`Created or found department: ${dept.name}`);
      } catch (error) {
        console.error(`Error creating department ${dept.name}:`, error.message);
      }
    }
    
    // Get all departments
    const deptResult = await pool.query('SELECT * FROM departments');
    const departments = deptResult.rows;
    
    // Create positions for each department
    for (const dept of departments) {
      // Create a director position
      try {
        await pool.query(
          'INSERT INTO positions (title, level, is_manager, department_id) VALUES ($1, $2, $3, $4) ON CONFLICT (title, department_id) DO NOTHING',
          [`${dept.name} Director`, 'Director', true, dept.id]
        );
        console.log(`Created or found director position for ${dept.name}`);
      } catch (error) {
        console.error(`Error creating director position for ${dept.name}:`, error.message);
      }
      
      // Create a manager position
      try {
        await pool.query(
          'INSERT INTO positions (title, level, is_manager, department_id) VALUES ($1, $2, $3, $4) ON CONFLICT (title, department_id) DO NOTHING',
          [`${dept.name} Manager`, 'Manager', true, dept.id]
        );
        console.log(`Created or found manager position for ${dept.name}`);
      } catch (error) {
        console.error(`Error creating manager position for ${dept.name}:`, error.message);
      }
      
      // Create regular positions
      const levels = ['Senior', 'Mid', 'Junior'];
      for (const level of levels) {
        try {
          await pool.query(
            'INSERT INTO positions (title, level, is_manager, department_id) VALUES ($1, $2, $3, $4) ON CONFLICT (title, department_id) DO NOTHING',
            [`${dept.name} ${level} Specialist`, level, false, dept.id]
          );
          console.log(`Created or found ${level} position for ${dept.name}`);
        } catch (error) {
          console.error(`Error creating ${level} position for ${dept.name}:`, error.message);
        }
      }
    }
    
    // Get all positions
    const posResult = await pool.query('SELECT * FROM positions');
    const positions = posResult.rows;
    
    // Create roles if they don't exist
    const roles = [
      { name: 'Employee', description: 'Regular employee with basic access' },
      { name: 'Manager', description: 'Department manager with access to department resources' },
      { name: 'Director', description: 'Director with elevated permissions' },
      { name: 'Executive', description: 'Executive leadership with high-level access' },
      { name: 'Administrator', description: 'System administrator with full access' }
    ];
    
    for (const role of roles) {
      try {
        await pool.query(
          'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [role.name, role.description]
        );
        console.log(`Created or found role: ${role.name}`);
      } catch (error) {
        console.error(`Error creating role ${role.name}:`, error.message);
      }
    }
    
    // Get all roles
    const roleResult = await pool.query('SELECT * FROM roles');
    const roleMap = {};
    for (const role of roleResult.rows) {
      roleMap[role.name] = role.id;
    }
    
    // Now create employees with proper hierarchy
    // First, create directors for each department
    const directorsByDept = {};
    
    for (const dept of departments) {
      const directorPosition = positions.find(p => 
        p.department_id === dept.id && p.level === 'Director'
      );
      
      if (directorPosition) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        
        try {
          // Create director
          const directorResult = await pool.query(
            `INSERT INTO employees 
             (first_name, last_name, email, work_email, phone, department_id, position_id, hire_date, status, employee_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
              firstName, 
              lastName,
              generateEmail(firstName, lastName),
              generateEmail(firstName, lastName),
              generatePhone(),
              dept.id,
              directorPosition.id,
              getRandomDate(2015, 2018),
              'Active',
              'Full-time'
            ]
          );
          
          const director = directorResult.rows[0];
          directorsByDept[dept.id] = director;
          
          // Assign director role
          await pool.query(
            'INSERT INTO employee_roles (employee_id, role_id) VALUES ($1, $2)',
            [director.id, roleMap['Director']]
          );
          
          console.log(`Created director: ${director.first_name} ${director.last_name} for ${dept.name}`);
        } catch (error) {
          console.error(`Error creating director for ${dept.name}:`, error.message);
        }
      }
    }
    
    // Create managers for each department (reporting to directors)
    const managersByDept = {};
    
    for (const dept of departments) {
      const managerPosition = positions.find(p => 
        p.department_id === dept.id && p.level === 'Manager'
      );
      
      if (managerPosition) {
        const director = directorsByDept[dept.id];
        
        // Create 1-2 managers per department
        const managersCount = Math.floor(Math.random() * 2) + 1;
        
        managersByDept[dept.id] = [];
        
        for (let i = 0; i < managersCount; i++) {
          const firstName = getRandomElement(firstNames);
          const lastName = getRandomElement(lastNames);
          
          try {
            // Create manager
            const managerResult = await pool.query(
              `INSERT INTO employees 
               (first_name, last_name, email, work_email, phone, department_id, position_id, reporting_manager_id, hire_date, status, employee_type) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
               RETURNING *`,
              [
                firstName, 
                lastName,
                generateEmail(firstName, lastName),
                generateEmail(firstName, lastName),
                generatePhone(),
                dept.id,
                managerPosition.id,
                director ? director.id : null,
                getRandomDate(2016, 2019),
                'Active',
                'Full-time'
              ]
            );
            
            const manager = managerResult.rows[0];
            managersByDept[dept.id].push(manager);
            
            // Assign manager role
            await pool.query(
              'INSERT INTO employee_roles (employee_id, role_id) VALUES ($1, $2)',
              [manager.id, roleMap['Manager']]
            );
            
            console.log(`Created manager: ${manager.first_name} ${manager.last_name} for ${dept.name}`);
          } catch (error) {
            console.error(`Error creating manager for ${dept.name}:`, error.message);
          }
        }
      }
    }
    
    // Now create regular employees (25 per department)
    const employeesPerDept = 25;
    
    for (const dept of departments) {
      // Get regular positions for this department
      const regularPositions = positions.filter(p => 
        p.department_id === dept.id && ['Senior', 'Mid', 'Junior'].includes(p.level)
      );
      
      if (regularPositions.length > 0) {
        const managers = managersByDept[dept.id] || [];
        const director = directorsByDept[dept.id];
        
        for (let i = 0; i < employeesPerDept; i++) {
          const position = getRandomElement(regularPositions);
          const firstName = getRandomElement(firstNames);
          const lastName = getRandomElement(lastNames);
          
          // Determine manager (80% report to a manager if available, 20% to director)
          let manager = null;
          if (managers.length > 0 && Math.random() < 0.8) {
            manager = getRandomElement(managers);
          } else {
            manager = director;
          }
          
          try {
            // Create employee
            const employeeResult = await pool.query(
              `INSERT INTO employees 
               (first_name, last_name, email, work_email, phone, department_id, position_id, reporting_manager_id, hire_date, status, employee_type) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
               RETURNING *`,
              [
                firstName, 
                lastName,
                generateEmail(firstName, lastName),
                generateEmail(firstName, lastName),
                generatePhone(),
                dept.id,
                position.id,
                manager ? manager.id : null,
                getRandomDate(2017, 2023),
                Math.random() > 0.05 ? 'Active' : 'On Leave', // 5% chance to be on leave
                Math.random() > 0.2 ? 'Full-time' : 'Part-time' // 20% part-time
              ]
            );
            
            const employee = employeeResult.rows[0];
            
            // Assign employee role
            await pool.query(
              'INSERT INTO employee_roles (employee_id, role_id) VALUES ($1, $2)',
              [employee.id, roleMap['Employee']]
            );
            
            if (i % 5 === 0) {
              console.log(`Created ${i+1} out of ${employeesPerDept} employees for ${dept.name}...`);
            }
          } catch (error) {
            console.error(`Error creating employee for ${dept.name}:`, error.message);
          }
        }
        
        console.log(`Completed creating ${employeesPerDept} employees for ${dept.name}`);
      }
    }
    
    // Count total employees
    const countResult = await pool.query('SELECT COUNT(*) FROM employees');
    const totalEmployees = parseInt(countResult.rows[0].count);
    
    console.log(`Seeding completed! Created a total of ${totalEmployees} employees.`);
    
  } catch (error) {
    console.error('Error in employee seeding process:', error);
  } finally {
    await pool.end();
  }
}

// Run the seeding process
seedEmployees();