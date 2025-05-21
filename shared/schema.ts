import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Position table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: integer("department_id").notNull(),
  description: text("description"),
}, (positions) => {
  return {
    titleUnique: uniqueIndex("position_title_unique").on(positions.title),
  };
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  title: true,
  departmentId: true,
  description: true,
});

// Department table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id"),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
  managerId: true,
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
  type: text("type").notNull(), // system_access, onboarding, issue, request, new_staff_request
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
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

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

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider").default('replit'), // 'replit', 'microsoft', 'direct', etc.
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: 'set null' }),
  isAdmin: boolean("is_admin").default(false),
  impersonatingId: integer("impersonating_id").references(() => employees.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credentials table for direct login
export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(), // Stores hashed password
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// Authentication settings table
export const authSettings = pgTable("auth_settings", {
  id: serial("id").primaryKey(),
  directLoginEnabled: boolean("direct_login_enabled").default(true),
  microsoftLoginEnabled: boolean("microsoft_login_enabled").default(false),
  replitLoginEnabled: boolean("replit_login_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedById: varchar("updated_by_id").references(() => users.id),
});

export const insertCredentialSchema = createInsertSchema(credentials).pick({
  userId: true,
  username: true,
  password: true,
  isEnabled: true,
});

export const insertAuthSettingsSchema = createInsertSchema(authSettings).pick({
  directLoginEnabled: true,
  microsoftLoginEnabled: true,
  replitLoginEnabled: true,
  updatedById: true,
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Credential = typeof credentials.$inferSelect;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type AuthSettings = typeof authSettings.$inferSelect;
export type InsertAuthSettings = z.infer<typeof insertAuthSettingsSchema>;

// Key-Value Store table
export const keyValueStore = pgTable("key_value_store", {
  id: serial("id").primaryKey(),
  namespace: varchar("namespace").notNull(), // Categorizes the type of data: 'user_preferences', 'app_config', 'announcements', 'session_data', 'cache'
  key: varchar("key").notNull(),
  value: jsonb("value").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Optional: only populated for user-specific data
  expiresAt: timestamp("expires_at"), // Optional: for temporary/cached data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    namespaceKeyUserIdx: index("namespace_key_user_idx").on(
      table.namespace, 
      table.key, 
      table.userId
    ),
    // Unique combinations of namespace+key+userId
    uniqueNamespaceKeyUserIdx: uniqueIndex("unique_namespace_key_user_idx")
      .on(table.namespace, table.key, table.userId)
  };
});

export const insertKeyValueSchema = createInsertSchema(keyValueStore).pick({
  namespace: true,
  key: true,
  value: true,
  userId: true,
  expiresAt: true,
});

export type KeyValueStore = typeof keyValueStore.$inferSelect;
export type InsertKeyValueStore = z.infer<typeof insertKeyValueSchema>;
