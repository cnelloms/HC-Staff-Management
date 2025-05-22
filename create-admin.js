import { db } from "./server/db.js";
import bcrypt from "bcryptjs";
import { users, credentials } from "./shared/schema.js";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    
    // Check if admin user already exists
    const existingCredentials = await db.query.credentials.findMany({
      where: (credentials, { eq }) => eq(credentials.username, 'admin'),
      limit: 1,
    });
    
    if (existingCredentials.length > 0) {
      console.log("Admin credentials already exist. Updating password...");
      
      // Update the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      await db.update(credentials)
        .set({ 
          passwordHash: passwordHash,
          isEnabled: true,
          updatedAt: new Date()
        })
        .where((c) => c.username === 'admin');
        
      console.log("Admin password updated!");
      return;
    }
    
    // Create the admin user
    const adminId = `direct_admin_chris`;
    
    // Check if the user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, adminId)
    });
    
    if (!existingUser) {
      console.log("Creating admin user record...");
      await db.insert(users).values({
        id: adminId,
        firstName: 'Global',
        lastName: 'Admin',
        email: 'testemail@123.com',
        authProvider: 'direct',
        isAdmin: true
      });
      console.log("Admin user created!");
    } else {
      console.log("Admin user exists, updating admin status...");
      await db.update(users)
        .set({ isAdmin: true })
        .where((u) => u.id === adminId);
    }
    
    // Create admin credentials
    console.log("Creating admin credentials...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await db.insert(credentials).values({
      userId: adminId,
      username: 'admin',
      passwordHash: passwordHash,
      isEnabled: true
    });
    
    console.log("Admin user setup successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    
  } catch (error) {
    console.error("Error setting up admin user:", error);
  }
}

createAdminUser().catch(error => {
  console.error("Error in admin user creation:", error);
});