import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { departments, employees, positions, users, credentials } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function importStaffFromCSV() {
  try {
    console.log('Starting staff import process...');
    
    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'attached_assets', 'random_active_directory.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} employee records in CSV`);
    
    // Get or create default department
    let defaultDeptId = 1; // Use existing default department if available
    
    // Check if we need to create a new department
    const existingDepts = await db.select().from(departments).where(eq(departments.id, defaultDeptId));
    if (existingDepts.length === 0) {
      console.log('Creating default department...');
      const [newDept] = await db.insert(departments).values({
        name: 'General',
        description: 'Default department for imported staff',
        businessUnit: 'Health Carousel'
      }).returning();
      defaultDeptId = newDept.id;
    }
    
    // Create a map to track departments
    const departmentMap = new Map();
    departmentMap.set('General', defaultDeptId);
    
    // Process each employee record
    for (const record of records) {
      try {
        // Extract department name from the record
        const departmentName = record['Home Department Description'];
        
        // Check if we need to create a new department
        if (departmentName && !departmentMap.has(departmentName)) {
          console.log(`Creating department: ${departmentName}`);
          const [newDept] = await db.insert(departments).values({
            name: departmentName,
            description: `Department imported from CSV: ${departmentName}`,
            businessUnit: record['Business Unit Description'] || 'Health Carousel'
          }).returning();
          departmentMap.set(departmentName, newDept.id);
        }
        
        const deptId = departmentMap.get(departmentName || 'General');
        
        // Create or get position
        const positionTitle = record['Job Title Description'];
        let positionId;
        
        const existingPositions = await db.select().from(positions)
          .where(eq(positions.title, positionTitle))
          .limit(1);
          
        if (existingPositions.length > 0) {
          positionId = existingPositions[0].id;
        } else {
          console.log(`Creating position: ${positionTitle}`);
          const [newPosition] = await db.insert(positions).values({
            title: positionTitle,
            departmentId: deptId,
            description: `Position imported from CSV: ${positionTitle}`
          }).returning();
          positionId = newPosition.id;
        }
        
        // Parse hire date
        const hireDate = new Date(record['Hire Date']);
        
        // Create employee
        console.log(`Creating employee: ${record['Legal First Name']} ${record['Last Name']}`);
        
        // Generate email if not present
        const email = record['Work Email'] || 
          `${record['Legal First Name'].toLowerCase()}.${record['Last Name'].toLowerCase()}@example.com`;
        
        // Create employee record
        const [newEmployee] = await db.insert(employees).values({
          firstName: record['Legal First Name'],
          lastName: record['Last Name'],
          email: email,
          phone: record['Work Phone'] || record['Work Mobile'],
          position: positionTitle,
          departmentId: deptId,
          hireDate: hireDate,
          status: 'active',
        }).returning();
        
        // Create user account and credentials
        const username = email.split('@')[0]; // Use part before @ as username
        const defaultPassword = 'password123'; // Default password that should be changed
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const [newUser] = await db.insert(users).values({
          id: `imp_${username}_${Math.floor(Math.random() * 1000)}`,
          email: email,
          firstName: record['Legal First Name'],
          lastName: record['Last Name'],
          authProvider: 'direct',
          employeeId: newEmployee.id,
          isAdmin: false,
        }).returning();
        
        await db.insert(credentials).values({
          userId: newUser.id,
          username: username,
          passwordHash: passwordHash,
          isEnabled: true,
        });
        
        console.log(`Created employee ID ${newEmployee.id} with username ${username}`);
      } catch (empError) {
        console.error(`Error processing employee ${record['Legal First Name']} ${record['Last Name']}:`, empError);
      }
    }
    
    console.log('Staff import completed successfully');
  } catch (error) {
    console.error('Error importing staff:', error);
  }
}

// Run the import function
importStaffFromCSV().then(() => {
  console.log('Import script finished');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});