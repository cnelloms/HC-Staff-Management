import "dotenv/config";
import { db } from "../server/db";
import { users, credentials } from "../shared/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

async function setAdminPassword() {
  try {
    // The email of the global admin we created earlier
    const email = "admin.global@example.com";
    
    // Get the user record
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    // Generate a secure password hash
    const password = "admin123"; // You should change this in production
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1
    });
    
    // Check if credentials already exist
    const existingCredentials = await db
      .select()
      .from(credentials)
      .where(eq(credentials.userId, user.id));
    
    if (existingCredentials.length > 0) {
      // Update existing credentials
      await db
        .update(credentials)
        .set({
          username: "admin",
          password: passwordHash,
          isEnabled: true
        })
        .where(eq(credentials.userId, user.id));
      
      console.log("Admin credentials updated successfully");
    } else {
      // Create new credentials
      await db.insert(credentials).values({
        userId: user.id,
        username: "admin",
        password: passwordHash,
        isEnabled: true
      });
      
      console.log("Admin credentials created successfully");
    }
    
    console.log("Admin login details:");
    console.log("Username: admin");
    console.log("Password: admin123"); // This is just for development 
    console.log("Note: Please change this password in production!");
    
  } catch (error) {
    console.error("Error setting admin password:", error);
  } finally {
    process.exit(0);
  }
}

setAdminPassword();