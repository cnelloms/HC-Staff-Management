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

// Permission table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  resource: text("resource").notNull(), // The resource type (e.g., "employee", "ticket", "system")
  action: text("action").notNull(), // The action (e.g., "view", "create", "update", "delete")
  scope: text("scope").notNull(), // The scope (e.g., "all", "own", "department")
  fieldLevel: json("field_level"), // Field-level permissions (e.g., { "salary": false, "ssn": false })
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPermissionSchema = createInsertSchema(permissions).pick({
  name: true,
  description: true,
  resource: true,
  action: true,
  scope: true,
  fieldLevel: true,
});

// Role table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  description: true,
  isDefault: true,
});

// Role Permission junction table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull(),
  permissionId: integer("permission_id").notNull(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).pick({
  roleId: true,
  permissionId: true,
});

// Employee Role junction table
export const employeeRoles = pgTable("employee_roles", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  roleId: integer("role_id").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const insertEmployeeRoleSchema = createInsertSchema(employeeRoles).pick({
  employeeId: true,
  roleId: true,
  assignedBy: true,
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

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type EmployeeRole = typeof employeeRoles.$inferSelect;
export type InsertEmployeeRole = z.infer<typeof insertEmployeeRoleSchema>;
