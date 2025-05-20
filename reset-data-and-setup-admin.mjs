import { db } from "./server/db.js";
import { 
  users, 
  credentials, 
  employees, 
  departments, 
  positions, 
  roles, 
  permissions,
  rolePermissions,
  employeeRoles,
  activities,
  tickets,
  systemAccess,
  systems
} from "./shared/schema.js";
import bcrypt from "bcryptjs";

async function resetDataAndSetupAdmin() {
  console.log("Starting data reset...");
  
  try {
    // Clear all existing data
    console.log("Clearing existing data...");
    await db.delete(employeeRoles);
    await db.delete(rolePermissions);
    await db.delete(activities);
    await db.delete(tickets);
    await db.delete(systemAccess);
    await db.delete(employees);
    await db.delete(positions);
    await db.delete(departments);
    await db.delete(systems);
    await db.delete(roles);
    await db.delete(permissions);
    await db.delete(credentials);
    await db.delete(users);
    
    console.log("All data cleared successfully");
    
    // Create a department for Chris Nelloms
    console.log("Creating IT department...");
    const [itDepartment] = await db.insert(departments)
      .values({
        name: "Information Technology",
        description: "Technology and systems management",
      })
      .returning();
    
    // Create a position for Chris Nelloms
    console.log("Creating CTO position...");
    const [ctoPosition] = await db.insert(positions)
      .values({
        title: "Chief Technology Officer",
        description: "Overall technology strategy and management",
        departmentId: itDepartment.id,
      })
      .returning();
    
    // Create Chris Nelloms employee record
    console.log("Creating Chris Nelloms employee record...");
    const [chrisEmployee] = await db.insert(employees)
      .values({
        firstName: "Chris",
        lastName: "Nelloms",
        email: "chris.nelloms@example.com",
        phone: "555-123-4567",
        positionId: ctoPosition.id,
        departmentId: itDepartment.id,
        hireDate: new Date(),
        status: "active",
      })
      .returning();
    
    // Create user record for Chris
    console.log("Creating Chris Nelloms user record...");
    const [chrisUser] = await db.insert(users)
      .values({
        id: "direct_admin_chris",
        firstName: "Chris",
        lastName: "Nelloms",
        email: "chris.nelloms@example.com",
        profileImageUrl: null,
        isAdmin: true,
        employeeId: chrisEmployee.id,
        authProvider: "direct",
      })
      .returning();
    
    // Create credentials for Chris
    console.log("Creating credentials for Chris...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);
    
    await db.insert(credentials)
      .values({
        userId: chrisUser.id,
        username: "cnelloms",
        passwordHash,
        isEnabled: true,
      });
    
    // Create Global Admin role
    console.log("Creating Global Admin role...");
    const [globalAdminRole] = await db.insert(roles)
      .values({
        name: "Global Admin",
        description: "Full access to all system features and data",
        isDefault: false,
      })
      .returning();
    
    // Create permissions for all resources
    console.log("Creating permissions...");
    const resources = [
      "employee", "department", "position", "system", 
      "systemAccess", "ticket", "activity", "role", "permission"
    ];
    
    const actions = ["create", "read", "update", "delete"];
    
    const permissionsToCreate = [];
    for (const resource of resources) {
      for (const action of actions) {
        permissionsToCreate.push({
          name: `${action}_${resource}`,
          description: `Can ${action} ${resource}s`,
          resource,
          action,
          scope: "all"
        });
      }
    }
    
    const createdPermissions = await db.insert(permissions)
      .values(permissionsToCreate)
      .returning();
    
    // Assign all permissions to Global Admin role
    console.log("Assigning permissions to Global Admin role...");
    for (const permission of createdPermissions) {
      await db.insert(rolePermissions)
        .values({
          roleId: globalAdminRole.id,
          permissionId: permission.id
        });
    }
    
    // Assign Global Admin role to Chris
    console.log("Assigning Global Admin role to Chris...");
    await db.insert(employeeRoles)
      .values({
        employeeId: chrisEmployee.id,
        roleId: globalAdminRole.id
      });
    
    console.log("Data reset complete!");
    console.log(`\nChris Nelloms has been set up as Global Admin`);
    console.log(`Username: cnelloms`);
    console.log(`Password: password123`);
    console.log(`\nPlease log in with these credentials.`);
  } catch (error) {
    console.error("Error resetting data:", error);
  } finally {
    // Close the database connection
    await db.client.end();
  }
}

// Execute the function
resetDataAndSetupAdmin().catch(error => {
  console.error("Error running script:", error);
});