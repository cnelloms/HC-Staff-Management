import { db } from './server/db.js';
import { departments, employees } from './shared/schema.js';

async function seed() {
  try {
    // Create sample departments
    console.log('Creating sample departments...');
    const departmentData = [
      { name: "Human Resources", description: "HR department responsible for personnel management" },
      { name: "Information Technology", description: "IT department handling technical systems" },
      { name: "Finance", description: "Finance department managing company finances" },
      { name: "Operations", description: "Operations department overseeing daily activities" },
      { name: "Clinical Staff", description: "Medical professionals providing patient care" }
    ];
    
    const insertedDepartments = await db.insert(departments).values(departmentData).returning();
    console.log(`Added ${insertedDepartments.length} departments`);
    
    // Create sample employees
    console.log('Creating sample employees...');
    const now = new Date();
    const employeeData = [
      { 
        firstName: "Sarah", 
        lastName: "Johnson", 
        email: "sarah.johnson@example.com", 
        phone: "555-123-4567", 
        position: "HR Administrator", 
        departmentId: insertedDepartments[0].id,
        hireDate: now, 
        status: "active", 
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Michael", 
        lastName: "Foster", 
        email: "michael.foster@example.com", 
        phone: "555-987-6543", 
        position: "IT Specialist", 
        departmentId: insertedDepartments[1].id,
        hireDate: now, 
        status: "active", 
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Robert", 
        lastName: "Johnson", 
        email: "robert.johnson@example.com", 
        phone: "555-234-5678", 
        position: "Financial Analyst", 
        departmentId: insertedDepartments[2].id,
        hireDate: now, 
        status: "active", 
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Sarah", 
        lastName: "Taylor", 
        email: "sarah.taylor@example.com", 
        phone: "555-345-6789", 
        position: "Nurse Practitioner", 
        departmentId: insertedDepartments[4].id,
        hireDate: now, 
        status: "onboarding", 
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Tom", 
        lastName: "Wilson", 
        email: "tom.wilson@example.com", 
        phone: "555-456-7890", 
        position: "Operations Manager", 
        departmentId: insertedDepartments[3].id,
        hireDate: now, 
        status: "active", 
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      }
    ];
    
    const insertedEmployees = await db.insert(employees).values(employeeData).returning();
    console.log(`Added ${insertedEmployees.length} employees`);
    
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exit(1);
  }
}

seed();