import { Router } from "express";
import { db } from "./db";
import { changeRequests, employees, auditLog } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "./middleware/role-middleware";
import { isAuthenticated } from "./replitAuth";

export const crRouter = Router();

/** helper: does manager manage target? */
async function manages(managerId: number, targetId: number) {
  try {
    const results = await db.query.employees.findMany({
      where: (fields, { and, eq }) => and(
        eq(fields.id, targetId),
        eq(fields.managerId, managerId)
      ),
      limit: 1
    });
    
    return results.length > 0;
  } catch (error) {
    console.error('Error checking manager relationship:', error);
    return false;
  }
}

/** create change request */
crRouter.post("/employees/:id/requests", isAuthenticated, async (req, res) => {
  const targetId = Number(req.params.id);
  
  // Ensure user has valid session and user info
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  
  // Get the employee ID from the request user's associated employee record
  // This checks if the user has an associated employee record
  if (!req.user.employeeId) {
    // If the user doesn't have an employeeId, try to find it by email
    const userEmployees = await db.query.employees.findMany({
      where: (fields, { eq }) => eq(fields.email, req.user.email || ''),
      limit: 1
    });
    
    if (userEmployees.length === 0) {
      return res.status(403).json({ message: "Your user account is not linked to an employee record" });
    }
  }
  
  // At this point we know we have a valid employee
  // Get employeeId either from user object or from the query above
  const myEmployeeId = req.user.employeeId || (await db.query.employees.findMany({
    where: (fields, { eq }) => eq(fields.email, req.user.email || ''),
    limit: 1
  }))[0].id;
  
  // Check if user is allowed to make changes
  const canSelf = myEmployeeId === targetId;
  const isManager = req.user.roles ? req.user.roles.includes("manager") : false;
  const canMgr = isManager && await manages(myEmployeeId, targetId);
  const isAdmin = req.user.isAdmin === true;
  
  if (!canSelf && !canMgr && !isAdmin) {
    return res.status(403).json({ message: "You don't have permission to create change requests for this employee" });
  }

  try {
    const { payload } = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ message: "Invalid payload format" });
    }
    
    const [cr] = await db
        .insert(changeRequests)
        .values({ 
          targetEmployeeId: targetId, 
          requesterEmployeeId: myEmployeeId, 
          payload 
        })
        .returning();
    
    res.status(201).json(cr);
  } catch (error) {
    console.error("Error creating change request:", error);
    res.status(500).json({ message: "Failed to create change request" });
  }
});

/** list pending requests */
crRouter.get("/change_requests", isAuthenticated, requireRole("admin"), async (_req, res) => {
  try {
    const rows = await db
        .select()
        .from(changeRequests)
        .where(eq(changeRequests.status, "pending"));
    
    res.json(rows);
  } catch (error) {
    console.error("Error fetching change requests:", error);
    res.status(500).json({ message: "Failed to fetch change requests" });
  }
});

/** approve / reject */
crRouter.patch("/change_requests/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
  const status = req.body.status;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(422).json({ message: "Status must be 'approved' or 'rejected'" });
  }

  try {
    if (!req.user?.employeeId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    
    const [cr] = await db
        .update(changeRequests)
        .set({ 
          status, 
          approvedById: req.user.employeeId,
          updatedAt: new Date()
        })
        .where(eq(changeRequests.id, Number(req.params.id)))
        .returning();

    if (!cr) {
      return res.status(404).json({ message: "Change request not found" });
    }

    if (status === "approved") {
      // apply diff to employees
      await db.update(employees)
        .set(cr.payload as any)
        .where(eq(employees.id, cr.targetEmployeeId));

      // write audit log
      await db.insert(auditLog).values({
        table: "employees",
        rowId: cr.targetEmployeeId,
        action: "update",
        diff: cr.payload,
        actedBy: req.user.employeeId
      });
    }
    
    res.json(cr);
  } catch (error) {
    console.error("Error updating change request:", error);
    res.status(500).json({ message: "Failed to update change request" });
  }
});

export default crRouter;