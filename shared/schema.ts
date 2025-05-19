import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Department table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
});

// Employee table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  departmentId: integer("department_id").notNull(),
  managerId: integer("manager_id"),
  hireDate: timestamp("hire_date").notNull(),
  status: text("status").default("active").notNull(), // active, inactive, onboarding
  avatar: text("avatar"),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  position: true,
  departmentId: true,
  managerId: true,
  hireDate: true,
  status: true,
  avatar: true,
});

// System table
export const systems = pgTable("systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // EHR, financial, scheduling, etc.
});

export const insertSystemSchema = createInsertSchema(systems).pick({
  name: true,
  description: true,
  category: true,
});

// System Access table
export const systemAccess = pgTable("system_access", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  systemId: integer("system_id").notNull(),
  accessLevel: text("access_level").notNull(), // read, write, admin
  granted: boolean("granted").default(false),
  grantedById: integer("granted_by_id"),
  grantedAt: timestamp("granted_at"),
  expiresAt: timestamp("expires_at"),
  status: text("status").default("pending").notNull(), // pending, active, revoked
});

export const insertSystemAccessSchema = createInsertSchema(systemAccess).pick({
  employeeId: true,
  systemId: true,
  accessLevel: true,
  granted: true,
  grantedById: true,
  grantedAt: true,
  expiresAt: true,
  status: true,
});

// Ticket table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestorId: integer("requestor_id").notNull(),
  assigneeId: integer("assignee_id"),
  status: text("status").default("open").notNull(), // open, in_progress, closed
  priority: text("priority").default("medium").notNull(), // low, medium, high
  type: text("type").notNull(), // system_access, onboarding, issue, request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  systemId: integer("system_id"),
  metadata: json("metadata"), // Additional data specific to ticket type
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  requestorId: true,
  assigneeId: true,
  status: true,
  priority: true,
  type: true,
  systemId: true,
  metadata: true,
  closedAt: true,
});

// Activity table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  activityType: text("activity_type").notNull(), // profile_update, system_access, ticket
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"), // Additional data related to the activity
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  employeeId: true,
  activityType: true,
  description: true,
  metadata: true,
});

// Type exports
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type System = typeof systems.$inferSelect;
export type InsertSystem = z.infer<typeof insertSystemSchema>;

export type SystemAccess = typeof systemAccess.$inferSelect;
export type InsertSystemAccess = z.infer<typeof insertSystemAccessSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
