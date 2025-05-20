// Script to generate test data for the employee management system
import { db } from './server/db.js';
import { 
  departments, 
  positions, 
  employees, 
  roles, 
  employeeRoles,
  users, 
  credentials 
} from './shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Names and departments for random generation
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Dorothy', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Donna', 'Andrew', 'Emily', 'Joshua', 'Michelle',
  'Kenneth', 'Amanda', 'Kevin', 'Melissa', 'Brian', 'Deborah', 'George', 'Stephanie',
  'Edward', 'Rebecca', 'Ronald', 'Laura', 'Timothy', 'Helen', 'Jason', 'Sharon',
  'Jeffrey', 'Cynthia', 'Ryan', 'Kathleen', 'Jacob', 'Amy', 'Gary', 'Shirley',
  'Nicholas', 'Angela', 'Eric', 'Anna', 'Jonathan', 'Ruth', 'Stephen', 'Brenda'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy'
];

const departmentData = [
  { name: 'Information Technology', description: 'IT department responsible for technical infrastructure' },
  { name: 'Human Resources', description: 'Responsible for recruiting and employee relations' },
  { name: 'Finance', description: 'Handles accounting, budgeting, and financial reporting' },
  { name: 'Marketing', description: 'Develops and implements marketing strategies' },
  { name: 'Operations', description: 'Oversees day-to-day business operations' },
  { name: 'Sales', description: 'Handles direct customer sales and account management' },
  { name: 'Research & Development', description: 'Focuses on innovation and product development' },
  { name: 'Customer Support', description: 'Provides assistance and support to customers' },
  { name: 'Legal', description: 'Handles legal matters and regulatory compliance' },
  { name: 'Executive', description: 'Executive leadership team' }
];

const positionsByDepartment = {
  'Information Technology': [
    { title: 'IT Director', level: 'Director', isManager: true },
    { title: 'IT Manager', level: 'Manager', isManager: true },
    { title: 'Systems Administrator', level: 'Senior', isManager: false },
    { title: 'Network Engineer', level: 'Senior', isManager: false },
    { title: 'Software Developer', level: 'Mid', isManager: false },
    { title: 'Database Administrator', level: 'Senior', isManager: false },
    { title: 'IT Support Specialist', level: 'Junior', isManager: false },
    { title: 'Security Analyst', level: 'Senior', isManager: false }
  ],
  'Human Resources': [
    { title: 'HR Director', level: 'Director', isManager: true },
    { title: 'HR Manager', level: 'Manager', isManager: true },
    { title: 'Recruiter', level: 'Mid', isManager: false },
    { title: 'Benefits Coordinator', level: 'Mid', isManager: false },
    { title: 'Training Specialist', level: 'Mid', isManager: false },
    { title: 'HR Assistant', level: 'Junior', isManager: false }
  ],
  'Finance': [
    { title: 'Finance Director', level: 'Director', isManager: true },
    { title: 'Finance Manager', level: 'Manager', isManager: true },
    { title: 'Senior Accountant', level: 'Senior', isManager: false },
    { title: 'Financial Analyst', level: 'Mid', isManager: false },
    { title: 'Payroll Specialist', level: 'Mid', isManager: false },
    { title: 'Accounts Payable Clerk', level: 'Junior', isManager: false },
    { title: 'Accounts Receivable Clerk', level: 'Junior', isManager: false }
  ],
  'Marketing': [
    { title: 'Marketing Director', level: 'Director', isManager: true },
    { title: 'Marketing Manager', level: 'Manager', isManager: true },
    { title: 'Marketing Specialist', level: 'Mid', isManager: false },
    { title: 'Content Creator', level: 'Mid', isManager: false },
    { title: 'SEO Specialist', level: 'Mid', isManager: false },
    { title: 'Social Media Coordinator', level: 'Junior', isManager: false },
    { title: 'Graphic Designer', level: 'Mid', isManager: false }
  ],
  'Operations': [
    { title: 'Operations Director', level: 'Director', isManager: true },
    { title: 'Operations Manager', level: 'Manager', isManager: true },
    { title: 'Project Manager', level: 'Senior', isManager: true },
    { title: 'Process Improvement Specialist', level: 'Senior', isManager: false },
    { title: 'Quality Assurance Analyst', level: 'Mid', isManager: false },
    { title: 'Logistics Coordinator', level: 'Mid', isManager: false },
    { title: 'Operations Assistant', level: 'Junior', isManager: false }
  ],
  'Sales': [
    { title: 'Sales Director', level: 'Director', isManager: true },
    { title: 'Sales Manager', level: 'Manager', isManager: true },
    { title: 'Senior Sales Representative', level: 'Senior', isManager: false },
    { title: 'Account Executive', level: 'Mid', isManager: false },
    { title: 'Inside Sales Representative', level: 'Junior', isManager: false },
    { title: 'Sales Development Representative', level: 'Junior', isManager: false }
  ],
  'Research & Development': [
    { title: 'R&D Director', level: 'Director', isManager: true },
    { title: 'R&D Manager', level: 'Manager', isManager: true },
    { title: 'Senior Research Scientist', level: 'Senior', isManager: false },
    { title: 'Product Developer', level: 'Mid', isManager: false },
    { title: 'Research Associate', level: 'Mid', isManager: false },
    { title: 'Lab Technician', level: 'Junior', isManager: false }
  ],
  'Customer Support': [
    { title: 'Customer Support Director', level: 'Director', isManager: true },
    { title: 'Customer Support Manager', level: 'Manager', isManager: true },
    { title: 'Senior Support Specialist', level: 'Senior', isManager: false },
    { title: 'Support Representative', level: 'Mid', isManager: false },
    { title: 'Technical Support Agent', level: 'Junior', isManager: false }
  ],
  'Legal': [
    { title: 'Legal Director', level: 'Director', isManager: true },
    { title: 'Legal Counsel', level: 'Senior', isManager: false },
    { title: 'Compliance Officer', level: 'Senior', isManager: false },
    { title: 'Legal Assistant', level: 'Junior', isManager: false }
  ],
  'Executive': [
    { title: 'Chief Executive Officer', level: 'Executive', isManager: true },
    { title: 'Chief Financial Officer', level: 'Executive', isManager: true },
    { title: 'Chief Operating Officer', level: 'Executive', isManager: true },
    { title: 'Chief Technology Officer', level: 'Executive', isManager: true },
    { title: 'Chief Marketing Officer', level: 'Executive', isManager: true },
    { title: 'Chief Human Resources Officer', level: 'Executive', isManager: true }
  ]
};

const roleData = [
  { name: 'Employee', description: 'Regular employee with basic access' },
  { name: 'Manager', description: 'Department manager with access to department resources' },
  { name: 'Director', description: 'Director with elevated permissions' },
  { name: 'Executive', description: 'Executive leadership with high-level access' },
  { name: 'Administrator', description: 'System administrator with full access' }
];

// Helper functions for random generation
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startYear = 2015, endYear = 2023) {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Avoiding edge cases with different month lengths
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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

async function generateTestData() {
  try {
    console.log('Starting test data generation...');
    
    // First, create departments
    console.log('Creating departments...');
    const createdDepartments = [];
    for (const dept of departmentData) {
      const [createdDept] = await db.insert(departments).values(dept).returning();
      createdDepartments.push(createdDept);
      console.log(`Created department: ${createdDept.name} (ID: ${createdDept.id})`);
    }
    
    // Create positions for each department
    console.log('Creating positions...');
    const createdPositions = {};
    for (const dept of createdDepartments) {
      createdPositions[dept.id] = [];
      const positionsForDept = positionsByDepartment[dept.name] || [];
      
      for (const pos of positionsForDept) {
        const [createdPos] = await db.insert(positions).values({
          ...pos,
          departmentId: dept.id
        }).returning();
        
        createdPositions[dept.id].push(createdPos);
        console.log(`Created position: ${createdPos.title} (ID: ${createdPos.id}) in department ${dept.name}`);
      }
    }
    
    // Create roles
    console.log('Creating roles...');
    const createdRoles = {};
    for (const role of roleData) {
      const [createdRole] = await db.insert(roles).values(role).returning();
      createdRoles[role.name] = createdRole;
      console.log(`Created role: ${createdRole.name} (ID: ${createdRole.id})`);
    }
    
    // Create employees with proper hierarchy
    console.log('Creating employees...');
    const totalEmployees = 500;
    const createdEmployees = [];
    
    // Create department directors first (one per department)
    for (const dept of createdDepartments) {
      const directorPositions = createdPositions[dept.id].filter(p => p.level === 'Director' || p.level === 'Executive');
      
      if (directorPositions.length > 0) {
        const position = getRandomElement(directorPositions);
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        
        const [director] = await db.insert(employees).values({
          firstName,
          lastName,
          email: generateEmail(firstName, lastName),
          workEmail: generateEmail(firstName, lastName),
          phone: generatePhone(),
          departmentId: dept.id,
          positionId: position.id,
          hireDate: getRandomDate(2015, 2018), // Directors hired earlier
          status: 'Active',
          employeeType: 'Full-time'
        }).returning();
        
        createdEmployees.push(director);
        
        // Assign Director role
        await db.insert(employeeRoles).values({
          employeeId: director.id,
          roleId: createdRoles[position.level === 'Executive' ? 'Executive' : 'Director'].id
        });
        
        console.log(`Created director: ${director.firstName} ${director.lastName} for ${dept.name} department`);
      }
    }
    
    // Create managers (reporting to directors)
    const directorsById = {};
    for (const director of createdEmployees) {
      directorsById[director.departmentId] = director;
    }
    
    // Create managers next
    for (const dept of createdDepartments) {
      const managerPositions = createdPositions[dept.id].filter(p => p.level === 'Manager');
      const director = directorsById[dept.id];
      
      // Create 1-3 managers per department
      const managersCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < managersCount && managerPositions.length > 0; i++) {
        const position = getRandomElement(managerPositions);
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        
        const [manager] = await db.insert(employees).values({
          firstName,
          lastName,
          email: generateEmail(firstName, lastName),
          workEmail: generateEmail(firstName, lastName),
          phone: generatePhone(),
          departmentId: dept.id,
          positionId: position.id,
          reportingManagerId: director ? director.id : null,
          hireDate: getRandomDate(2016, 2019), // Managers hired after directors
          status: 'Active',
          employeeType: 'Full-time'
        }).returning();
        
        createdEmployees.push(manager);
        
        // Assign Manager role
        await db.insert(employeeRoles).values({
          employeeId: manager.id,
          roleId: createdRoles['Manager'].id
        });
        
        console.log(`Created manager: ${manager.firstName} ${manager.lastName} in ${dept.name} department`);
      }
    }
    
    // Create regular employees (for the rest of the total)
    const managersById = {};
    for (const emp of createdEmployees) {
      if (createdPositions[emp.departmentId].find(p => p.id === emp.positionId)?.level === 'Manager') {
        if (!managersById[emp.departmentId]) {
          managersById[emp.departmentId] = [];
        }
        managersById[emp.departmentId].push(emp);
      }
    }
    
    const remainingCount = totalEmployees - createdEmployees.length;
    console.log(`Creating ${remainingCount} regular employees...`);
    
    for (let i = 0; i < remainingCount; i++) {
      const dept = getRandomElement(createdDepartments);
      const regularPositions = createdPositions[dept.id].filter(p => 
        ['Senior', 'Mid', 'Junior'].includes(p.level)
      );
      
      if (regularPositions.length > 0) {
        const position = getRandomElement(regularPositions);
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        
        // Find a manager to report to
        const departmentManagers = managersById[dept.id] || [];
        const manager = departmentManagers.length > 0 
          ? getRandomElement(departmentManagers) 
          : directorsById[dept.id] || null;
        
        const [employee] = await db.insert(employees).values({
          firstName,
          lastName,
          email: generateEmail(firstName, lastName),
          workEmail: generateEmail(firstName, lastName),
          phone: generatePhone(),
          departmentId: dept.id,
          positionId: position.id,
          reportingManagerId: manager ? manager.id : null,
          hireDate: getRandomDate(2017, 2023),
          status: Math.random() > 0.05 ? 'Active' : 'On Leave', // 5% chance to be on leave
          employeeType: Math.random() > 0.2 ? 'Full-time' : 'Part-time' // 20% part-time
        }).returning();
        
        // Assign Employee role
        await db.insert(employeeRoles).values({
          employeeId: employee.id,
          roleId: createdRoles['Employee'].id
        });
        
        if (i % 50 === 0) {
          console.log(`Created ${i} out of ${remainingCount} regular employees...`);
        }
      }
    }
    
    console.log('Test data generation completed successfully!');
    console.log(`Total employees created: ${totalEmployees}`);
    
  } catch (error) {
    console.error('Error generating test data:', error);
  } finally {
    // Close the database connection
    await db.client.end();
  }
}

// Run the data generation
generateTestData();