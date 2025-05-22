import "dotenv/config";
import { db } from "../server/db";
import { employees, roles, employeeRoles } from "../shared/schema";
import { eq } from "drizzle-orm";

// 1. Ensure the admin role exists
async function ensureAdminRole() {
  const [adminRole] = await db
    .insert(roles)
    .values({ name: "admin", description: "Global administrator" })
    .onConflictDoNothing()
    .returning();
  if (adminRole) return adminRole.id;

  const [{ id }] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "admin"));
  return id;
}

// 2. Create or fetch the admin employee record
async function ensureAdminEmployee() {
  const email = "admin.global@example.com";
  const existing = await db
    .select()
    .from(employees)
    .where(eq(employees.email, email));

  if (existing.length) return existing[0].id;

  const [emp] = await db
    .insert(employees)
    .values({
      firstName: "Global",
      lastName: "Admin",
      email,
      phone: "000-000-0000",
      position: "System Administrator",
      departmentId: 1,                 // update if you have a real dept ID
      hireDate: new Date(),
    })
    .returning();
  return emp.id;
}

// 3. Link the employee to the admin role
(async () => {
  const roleId = await ensureAdminRole();
  const employeeId = await ensureAdminEmployee();

  await db
    .insert(employeeRoles)
    .values({ employeeId, roleId, assignedBy: employeeId }) // Self-assigned for bootstrap
    .onConflictDoNothing();

  console.log(`✔ Global Admin ready (employee_id=${employeeId}, role_id=${roleId})`);
  process.exit(0);
})();