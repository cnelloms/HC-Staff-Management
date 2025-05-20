import { db } from './server/db.js';
import { 
  departments, positions, employees, systems, 
  tickets, activities, roles, permissions,
  rolePermissions, employeeRoles, systemAccess
} from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  // Clear existing data
  try {
    console.log('Clearing existing data...');
    await db.delete(employeeRoles);
    await db.delete(rolePermissions);
    await db.delete(activities);
    await db.delete(systemAccess);
    await db.delete(tickets);
    await db.delete(permissions);
    await db.delete(roles);
    await db.delete(employees);
    await db.delete(systems);
    await db.delete(positions);
    await db.delete(departments);
    console.log('✅ Successfully cleared existing data');
  } catch (error) {
    console.error('Error clearing existing data:', error);
  }

  // Seed departments
  console.log('Seeding departments...');
  const departmentData = [
    { name: 'IT', description: 'Information Technology Department' },
    { name: 'HR', description: 'Human Resources Department' },
    { name: 'Finance', description: 'Finance and Accounting Department' },
    { name: 'Operations', description: 'Operations Department' },
    { name: 'Marketing', description: 'Marketing and Communications Department' }
  ];
  
  const departmentResult = await db.insert(departments).values(departmentData).returning();
  console.log(`✅ Added ${departmentResult.length} departments`);
  
  // Map department names to their IDs for easy reference
  const departmentMap = {};
  departmentResult.forEach(dept => {
    departmentMap[dept.name] = dept.id;
  });
  
  // Seed positions
  console.log('Seeding positions...');
  const positionData = [
    { title: 'IT Manager', departmentId: departmentMap['IT'], description: 'Manager of IT department' },
    { title: 'System Administrator', departmentId: departmentMap['IT'], description: 'Manages system infrastructure' },
    { title: 'Developer', departmentId: departmentMap['IT'], description: 'Develops and maintains software' },
    { title: 'HR Manager', departmentId: departmentMap['HR'], description: 'Manager of HR department' },
    { title: 'HR Specialist', departmentId: departmentMap['HR'], description: 'Handles specific HR functions' },
    { title: 'Financial Analyst', departmentId: departmentMap['Finance'], description: 'Analyzes financial data' },
    { title: 'Accountant', departmentId: departmentMap['Finance'], description: 'Manages company accounts' },
    { title: 'Operations Manager', departmentId: departmentMap['Operations'], description: 'Oversees operations' },
    { title: 'Marketing Director', departmentId: departmentMap['Marketing'], description: 'Directs marketing activities' },
    { title: 'Marketing Specialist', departmentId: departmentMap['Marketing'], description: 'Specializes in marketing areas' }
  ];
  
  const positionResult = await db.insert(positions).values(positionData).returning();
  console.log(`✅ Added ${positionResult.length} positions`);
  
  // Map position titles to their IDs
  const positionMap = {};
  positionResult.forEach(pos => {
    positionMap[pos.title] = pos.id;
  });
  
  // Seed employees
  console.log('Seeding employees...');
  const currentDate = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

  const employeeData = [
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '555-123-4567',
      position: 'IT Manager',
      departmentId: departmentMap['IT'],
      hireDate: twoYearsAgo,
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random'
    },
    {
      firstName: 'Michael',
      lastName: 'Williams',
      email: 'michael.williams@example.com',
      phone: '555-234-5678',
      position: 'System Administrator',
      departmentId: departmentMap['IT'],
      managerId: 1, // Will be updated after insert
      hireDate: oneYearAgo,
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Michael+Williams&background=random'
    },
    {
      firstName: 'Jessica',
      lastName: 'Brown',
      email: 'jessica.brown@example.com',
      phone: '555-345-6789',
      position: 'HR Manager',
      departmentId: departmentMap['HR'],
      hireDate: oneYearAgo,
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Jessica+Brown&background=random'
    },
    {
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@example.com',
      phone: '555-456-7890',
      position: 'Financial Analyst',
      departmentId: departmentMap['Finance'],
      hireDate: sixMonthsAgo,
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=David+Miller&background=random'
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@example.com',
      phone: '555-567-8901',
      position: 'Marketing Director',
      departmentId: departmentMap['Marketing'],
      hireDate: threeMonthsAgo,
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=random'
    },
    {
      firstName: 'Alex',
      lastName: 'Wilson',
      email: 'alex.wilson@example.com',
      phone: '555-678-9012',
      position: 'Developer',
      departmentId: departmentMap['IT'],
      managerId: 1, // Will be updated after insert
      hireDate: currentDate,
      status: 'onboarding',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Wilson&background=random'
    }
  ];
  
  const employeeResult = await db.insert(employees).values(employeeData).returning();
  console.log(`✅ Added ${employeeResult.length} employees`);
  
  // Map employee names to their IDs
  const employeeMap = {};
  employeeResult.forEach(emp => {
    employeeMap[`${emp.firstName} ${emp.lastName}`] = emp.id;
  });
  
  // Update manager IDs now that we have employee IDs
  await db
    .update(employees)
    .set({ managerId: employeeMap['Sarah Johnson'] })
    .where(eq(employees.id, employeeMap['Michael Williams']));
  
  await db
    .update(employees)
    .set({ managerId: employeeMap['Sarah Johnson'] })
    .where(eq(employees.id, employeeMap['Alex Wilson']));
  
  // Seed systems
  console.log('Seeding systems...');
  const systemData = [
    { name: 'Email System', description: 'Corporate email system', category: 'communication' },
    { name: 'HR Portal', description: 'Human resources management portal', category: 'hr' },
    { name: 'Finance System', description: 'Financial management system', category: 'finance' },
    { name: 'CRM', description: 'Customer Relationship Management system', category: 'sales' },
    { name: 'Project Management', description: 'Project tracking and management', category: 'operations' }
  ];
  
  const systemResult = await db.insert(systems).values(systemData).returning();
  console.log(`✅ Added ${systemResult.length} systems`);
  
  // Map system names to their IDs
  const systemMap = {};
  systemResult.forEach(sys => {
    systemMap[sys.name] = sys.id;
  });
  
  // Seed permissions
  console.log('Seeding permissions...');
  const permissionData = [
    { 
      name: 'View Employees', 
      description: 'Can view employee records',
      resource: 'employee',
      action: 'view',
      scope: 'all'
    },
    { 
      name: 'Create Employees', 
      description: 'Can create new employees',
      resource: 'employee',
      action: 'create',
      scope: 'all'
    },
    { 
      name: 'Edit Employees', 
      description: 'Can edit employee records',
      resource: 'employee',
      action: 'edit',
      scope: 'all'
    },
    { 
      name: 'View Tickets', 
      description: 'Can view all tickets',
      resource: 'ticket',
      action: 'view',
      scope: 'all'
    },
    { 
      name: 'Create Tickets', 
      description: 'Can create tickets',
      resource: 'ticket',
      action: 'create',
      scope: 'all'
    },
    { 
      name: 'Assign Tickets', 
      description: 'Can assign tickets to employees',
      resource: 'ticket',
      action: 'assign',
      scope: 'all'
    },
    { 
      name: 'Close Tickets', 
      description: 'Can close tickets',
      resource: 'ticket',
      action: 'close',
      scope: 'all'
    },
    { 
      name: 'View System Access', 
      description: 'Can view system access records',
      resource: 'system_access',
      action: 'view',
      scope: 'all'
    },
    { 
      name: 'Grant System Access', 
      description: 'Can grant system access',
      resource: 'system_access',
      action: 'grant',
      scope: 'all'
    },
    { 
      name: 'Revoke System Access', 
      description: 'Can revoke system access',
      resource: 'system_access',
      action: 'revoke',
      scope: 'all'
    },
    { 
      name: 'Manage Roles', 
      description: 'Can manage roles and permissions',
      resource: 'role',
      action: 'manage',
      scope: 'all'
    },
    { 
      name: 'Assign Roles', 
      description: 'Can assign roles to employees',
      resource: 'role',
      action: 'assign',
      scope: 'all'
    }
  ];
  
  const permissionResult = await db.insert(permissions).values(permissionData).returning();
  console.log(`✅ Added ${permissionResult.length} permissions`);
  
  // Map permission names to their IDs
  const permissionMap = {};
  permissionResult.forEach(perm => {
    permissionMap[perm.name] = perm.id;
  });
  
  // Seed roles
  console.log('Seeding roles...');
  const roleData = [
    { 
      name: 'Administrator', 
      description: 'Full access to all system functions',
      isDefault: false
    },
    { 
      name: 'HR Staff', 
      description: 'Access to HR functions and employee records',
      isDefault: false
    },
    { 
      name: 'IT Support', 
      description: 'Access to tickets and system management',
      isDefault: false
    },
    { 
      name: 'Manager', 
      description: 'Department management access',
      isDefault: false
    },
    { 
      name: 'Employee', 
      description: 'Basic employee access',
      isDefault: true
    }
  ];
  
  const roleResult = await db.insert(roles).values(roleData).returning();
  console.log(`✅ Added ${roleResult.length} roles`);
  
  // Map role names to their IDs
  const roleMap = {};
  roleResult.forEach(role => {
    roleMap[role.name] = role.id;
  });
  
  // Seed role permissions
  console.log('Seeding role permissions...');
  const rolePermissionData = [
    // Administrator role - all permissions
    ...permissionResult.map(permission => ({
      roleId: roleMap['Administrator'],
      permissionId: permission.id
    })),
    
    // HR Staff
    { roleId: roleMap['HR Staff'], permissionId: permissionMap['View Employees'] },
    { roleId: roleMap['HR Staff'], permissionId: permissionMap['Create Employees'] },
    { roleId: roleMap['HR Staff'], permissionId: permissionMap['Edit Employees'] },
    { roleId: roleMap['HR Staff'], permissionId: permissionMap['View Tickets'] },
    { roleId: roleMap['HR Staff'], permissionId: permissionMap['Create Tickets'] },
    { roleId: roleMap['HR Staff'], permissionId: permissionMap['Assign Roles'] },
    
    // IT Support
    { roleId: roleMap['IT Support'], permissionId: permissionMap['View Employees'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['View Tickets'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['Create Tickets'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['Assign Tickets'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['Close Tickets'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['View System Access'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['Grant System Access'] },
    { roleId: roleMap['IT Support'], permissionId: permissionMap['Revoke System Access'] },
    
    // Manager
    { roleId: roleMap['Manager'], permissionId: permissionMap['View Employees'] },
    { roleId: roleMap['Manager'], permissionId: permissionMap['Edit Employees'] },
    { roleId: roleMap['Manager'], permissionId: permissionMap['View Tickets'] },
    { roleId: roleMap['Manager'], permissionId: permissionMap['Create Tickets'] },
    { roleId: roleMap['Manager'], permissionId: permissionMap['Assign Tickets'] },
    { roleId: roleMap['Manager'], permissionId: permissionMap['Close Tickets'] },
    { roleId: roleMap['Manager'], permissionId: permissionMap['View System Access'] },
    
    // Employee
    { roleId: roleMap['Employee'], permissionId: permissionMap['View Employees'] },
    { roleId: roleMap['Employee'], permissionId: permissionMap['View Tickets'] },
    { roleId: roleMap['Employee'], permissionId: permissionMap['Create Tickets'] }
  ];
  
  const rolePermissionResult = await db.insert(rolePermissions).values(rolePermissionData).returning();
  console.log(`✅ Added ${rolePermissionResult.length} role permissions`);
  
  // Seed employee roles
  console.log('Seeding employee roles...');
  const employeeRoleData = [
    // Sarah Johnson is an Administrator
    { 
      employeeId: employeeMap['Sarah Johnson'], 
      roleId: roleMap['Administrator'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    
    // Michael Williams is IT Support
    { 
      employeeId: employeeMap['Michael Williams'], 
      roleId: roleMap['IT Support'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    
    // Jessica Brown is HR Staff
    { 
      employeeId: employeeMap['Jessica Brown'], 
      roleId: roleMap['HR Staff'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    
    // David Miller is Manager
    { 
      employeeId: employeeMap['David Miller'], 
      roleId: roleMap['Manager'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    
    // Emily Davis is Manager
    { 
      employeeId: employeeMap['Emily Davis'], 
      roleId: roleMap['Manager'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    
    // All employees have the Employee role
    { 
      employeeId: employeeMap['Sarah Johnson'], 
      roleId: roleMap['Employee'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    { 
      employeeId: employeeMap['Michael Williams'], 
      roleId: roleMap['Employee'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    { 
      employeeId: employeeMap['Jessica Brown'], 
      roleId: roleMap['Employee'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    { 
      employeeId: employeeMap['David Miller'], 
      roleId: roleMap['Employee'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    { 
      employeeId: employeeMap['Emily Davis'], 
      roleId: roleMap['Employee'],
      assignedBy: employeeMap['Sarah Johnson']
    },
    { 
      employeeId: employeeMap['Alex Wilson'], 
      roleId: roleMap['Employee'],
      assignedBy: employeeMap['Sarah Johnson']
    }
  ];
  
  const employeeRoleResult = await db.insert(employeeRoles).values(employeeRoleData).returning();
  console.log(`✅ Added ${employeeRoleResult.length} employee roles`);
  
  // Seed system access
  console.log('Seeding system access...');
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(currentDate.getMonth() + 1);

  const systemAccessData = [
    // Active system access
    { 
      employeeId: employeeMap['Sarah Johnson'],
      systemId: systemMap['Email System'],
      accessLevel: 'admin',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: oneYearAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['Sarah Johnson'],
      systemId: systemMap['HR Portal'],
      accessLevel: 'admin',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: oneYearAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['Michael Williams'],
      systemId: systemMap['Email System'],
      accessLevel: 'admin',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: sixMonthsAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['Jessica Brown'],
      systemId: systemMap['HR Portal'],
      accessLevel: 'admin',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: sixMonthsAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['David Miller'],
      systemId: systemMap['Finance System'],
      accessLevel: 'admin',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: threeMonthsAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['Emily Davis'],
      systemId: systemMap['CRM'],
      accessLevel: 'admin',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: threeMonthsAgo,
      status: 'active'
    },
    
    // All employees have read access to Email
    { 
      employeeId: employeeMap['Michael Williams'],
      systemId: systemMap['Email System'],
      accessLevel: 'read',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: sixMonthsAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['Jessica Brown'],
      systemId: systemMap['Email System'],
      accessLevel: 'read',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: sixMonthsAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['David Miller'],
      systemId: systemMap['Email System'],
      accessLevel: 'read',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: sixMonthsAgo,
      status: 'active'
    },
    { 
      employeeId: employeeMap['Emily Davis'],
      systemId: systemMap['Email System'],
      accessLevel: 'read',
      granted: true,
      grantedById: employeeMap['Sarah Johnson'],
      grantedAt: sixMonthsAgo,
      status: 'active'
    },
    
    // Pending system access requests
    { 
      employeeId: employeeMap['Alex Wilson'],
      systemId: systemMap['Email System'],
      accessLevel: 'read',
      granted: false,
      status: 'pending'
    },
    { 
      employeeId: employeeMap['Alex Wilson'],
      systemId: systemMap['Project Management'],
      accessLevel: 'write',
      granted: false,
      status: 'pending'
    }
  ];
  
  const systemAccessResult = await db.insert(systemAccess).values(systemAccessData).returning();
  console.log(`✅ Added ${systemAccessResult.length} system access entries`);
  
  // Seed tickets
  console.log('Seeding tickets...');
  
  // Define ticket metadata for new staff requests
  const newStaffMetadata = {
    firstName: "John",
    lastName: "Smith",
    position: "Developer",
    manager: employeeMap['Sarah Johnson'],
    startDate: currentDate.toISOString(),
    tasks: [
      { id: 1, description: "Create work email for new staff", completed: false },
      { id: 2, description: "Generate secure password", completed: false },
      { id: 3, description: "Provide credentials to manager", completed: false }
    ]
  };
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(currentDate.getDate() - 1);

  const ticketData = [
    // New Staff Request Ticket - Open
    { 
      title: "New Staff Onboarding - Alex Wilson",
      description: "Please set up systems access for our new developer Alex Wilson starting today.",
      requestorId: employeeMap['Sarah Johnson'],
      status: 'open',
      priority: 'high',
      type: 'new_staff_request',
      createdAt: yesterdayDate,
      updatedAt: yesterdayDate,
      metadata: {
        firstName: "Alex",
        lastName: "Wilson",
        position: "Developer",
        manager: employeeMap['Sarah Johnson'],
        startDate: currentDate.toISOString(),
        tasks: [
          { id: 1, description: "Create work email for new staff", completed: false },
          { id: 2, description: "Generate secure password", completed: false },
          { id: 3, description: "Provide credentials to manager", completed: false }
        ]
      }
    },
    
    // New Staff Request Ticket - In Progress
    { 
      title: "New Staff Request - Upcoming Junior Developer",
      description: "We have a new junior developer starting next week. Please prepare all necessary systems access.",
      requestorId: employeeMap['Michael Williams'],
      assigneeId: employeeMap['Sarah Johnson'],
      status: 'in_progress',
      priority: 'medium',
      type: 'new_staff_request',
      createdAt: threeMonthsAgo,
      updatedAt: yesterdayDate,
      metadata: newStaffMetadata
    },
    
    // System Access Request - Open
    { 
      title: "Requesting Access for Finance System",
      description: "I need access to the Finance System to prepare budget reports.",
      requestorId: employeeMap['Emily Davis'],
      status: 'open',
      priority: 'medium',
      type: 'system_access',
      createdAt: yesterdayDate,
      updatedAt: yesterdayDate,
      systemId: systemMap['Finance System']
    },
    
    // System Access Request - Closed
    { 
      title: "Project Management System Access",
      description: "Please provide admin access to the Project Management system.",
      requestorId: employeeMap['David Miller'],
      assigneeId: employeeMap['Sarah Johnson'],
      status: 'closed',
      priority: 'low',
      type: 'system_access',
      createdAt: sixMonthsAgo,
      updatedAt: threeMonthsAgo,
      closedAt: threeMonthsAgo,
      systemId: systemMap['Project Management']
    },
    
    // Issue Ticket - In Progress
    { 
      title: "Email System Not Working",
      description: "I'm unable to send emails. Getting error message: Connection timed out.",
      requestorId: employeeMap['Jessica Brown'],
      assigneeId: employeeMap['Michael Williams'],
      status: 'in_progress',
      priority: 'high',
      type: 'issue',
      createdAt: yesterdayDate,
      updatedAt: yesterdayDate,
      systemId: systemMap['Email System']
    }
  ];
  
  const ticketResult = await db.insert(tickets).values(ticketData).returning();
  console.log(`✅ Added ${ticketResult.length} tickets`);
  
  // Seed activities
  console.log('Seeding activities...');
  
  const activityData = [
    // Profile updates
    { 
      employeeId: employeeMap['Sarah Johnson'],
      activityType: 'profile_update',
      description: 'Updated profile information',
      timestamp: sixMonthsAgo
    },
    { 
      employeeId: employeeMap['Michael Williams'],
      activityType: 'profile_update',
      description: 'Changed phone number',
      timestamp: threeMonthsAgo
    },
    
    // System access activities
    { 
      employeeId: employeeMap['Sarah Johnson'],
      activityType: 'system_access',
      description: 'Granted HR Portal access to Jessica Brown',
      timestamp: sixMonthsAgo,
      metadata: {
        grantedTo: employeeMap['Jessica Brown'],
        system: systemMap['HR Portal']
      }
    },
    { 
      employeeId: employeeMap['Sarah Johnson'],
      activityType: 'system_access',
      description: 'Granted Finance System access to David Miller',
      timestamp: threeMonthsAgo,
      metadata: {
        grantedTo: employeeMap['David Miller'],
        system: systemMap['Finance System']
      }
    },
    
    // Ticket activities
    { 
      employeeId: employeeMap['Michael Williams'],
      activityType: 'ticket',
      description: 'Created support ticket: Email System Not Working',
      timestamp: yesterdayDate
    },
    { 
      employeeId: employeeMap['Sarah Johnson'],
      activityType: 'ticket',
      description: 'Closed ticket: Project Management System Access',
      timestamp: threeMonthsAgo
    },
    
    // Onboarding activities
    { 
      employeeId: employeeMap['Sarah Johnson'],
      activityType: 'onboarding',
      description: 'Started onboarding process for Alex Wilson',
      timestamp: currentDate
    }
  ];
  
  const activityResult = await db.insert(activities).values(activityData).returning();
  console.log(`✅ Added ${activityResult.length} activities`);
  
  console.log('✅ Database seeding completed successfully!');
}

seed()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });