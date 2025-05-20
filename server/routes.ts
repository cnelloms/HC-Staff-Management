import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDepartmentSchema, insertEmployeeSchema, insertSystemSchema, 
  insertSystemAccessSchema, insertTicketSchema, insertActivitySchema,
  insertPermissionSchema, insertRoleSchema, insertRolePermissionSchema, insertEmployeeRoleSchema,
  insertPositionSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Feature flags
  app.get('/api/feature-flags', async (req, res) => {
    try {
      // Feature toggle settings
      const featureFlags = {
        staffImport: {
          enabled: true  // Set to false to disable staff import feature
        },
        focusLMS: true  // Focus on Health Carousel Academy LMS
      };
      
      res.json(featureFlags);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });
  
  // Dashboard routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/dashboard/access-stats', async (req, res) => {
    try {
      const stats = await storage.getSystemAccessStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch system access stats' });
    }
  });

  app.get('/api/dashboard/recent-activities', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      
      // Fetch employee details for each activity
      const activitiesWithEmployee = await Promise.all(
        activities.map(async (activity) => {
          const employee = await storage.getEmployeeById(activity.employeeId);
          return {
            ...activity,
            employee: employee ? {
              id: employee.id,
              name: `${employee.firstName} ${employee.lastName}`,
              avatar: employee.avatar,
              position: employee.position
            } : null
          };
        })
      );
      
      res.json(activitiesWithEmployee);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recent activities' });
    }
  });

  // Position routes
  app.get('/api/positions', async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch positions' });
    }
  });

  app.get('/api/positions/department/:departmentId', async (req, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const positions = await storage.getPositionsByDepartment(departmentId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch positions by department' });
    }
  });

  app.post('/api/positions', async (req, res) => {
    try {
      const positionData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(positionData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid position data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create position' });
      }
    }
  });

  // Department routes
  app.get('/api/departments', async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch departments' });
    }
  });

  app.get('/api/departments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
      
      const department = await storage.getDepartmentById(id);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch department' });
    }
  });

  app.post('/api/departments', async (req, res) => {
    try {
      const validationResult = insertDepartmentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid department data', errors: validationResult.error.errors });
      }
      
      const department = await storage.createDepartment(validationResult.data);
      res.status(201).json(department);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create department' });
    }
  });

  // Employee routes
  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      
      // Fetch department details for each employee
      const employeesWithDepartment = await Promise.all(
        employees.map(async (employee) => {
          const department = await storage.getDepartmentById(employee.departmentId);
          return {
            ...employee,
            department: department ? {
              id: department.id,
              name: department.name
            } : null
          };
        })
      );
      
      res.json(employeesWithDepartment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  app.get('/api/employees/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const employee = await storage.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Get department and manager details
      const department = await storage.getDepartmentById(employee.departmentId);
      const manager = employee.managerId 
        ? await storage.getEmployeeById(employee.managerId) 
        : null;
        
      // Get system access info
      const systemAccess = await storage.getSystemAccessByEmployeeId(id);
      const systemAccessWithDetails = await Promise.all(
        systemAccess.map(async (access) => {
          const system = await storage.getSystemById(access.systemId);
          const grantedBy = access.grantedById 
            ? await storage.getEmployeeById(access.grantedById) 
            : null;
            
          return {
            ...access,
            system: system ? {
              id: system.id,
              name: system.name,
              description: system.description
            } : null,
            grantedBy: grantedBy ? {
              id: grantedBy.id,
              name: `${grantedBy.firstName} ${grantedBy.lastName}`
            } : null
          };
        })
      );
      
      // Get employee tickets
      const tickets = await storage.getTicketsByRequestorId(id);
      
      // Get employee activities
      const activities = await storage.getActivitiesByEmployeeId(id);
      
      res.json({
        ...employee,
        department: department ? {
          id: department.id,
          name: department.name
        } : null,
        manager: manager ? {
          id: manager.id,
          name: `${manager.firstName} ${manager.lastName}`,
          position: manager.position
        } : null,
        systemAccess: systemAccessWithDetails,
        tickets,
        activities
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee details' });
    }
  });

  app.post('/api/employees', async (req, res) => {
    try {
      const validationResult = insertEmployeeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid employee data', errors: validationResult.error.errors });
      }
      
      const employee = await storage.createEmployee(validationResult.data);
      
      // Create activity for new employee
      await storage.createActivity({
        employeeId: employee.id,
        activityType: 'onboarding',
        description: 'New employee onboarding started',
        metadata: {
          departmentId: employee.departmentId,
          position: employee.position
        }
      });
      
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create employee' });
    }
  });

  app.patch('/api/employees/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const validationSchema = insertEmployeeSchema.partial();
      const validationResult = validationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid employee data', errors: validationResult.error.errors });
      }
      
      const updatedEmployee = await storage.updateEmployee(id, validationResult.data);
      if (!updatedEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Create activity for employee update
      await storage.createActivity({
        employeeId: id,
        activityType: 'profile_update',
        description: 'Employee profile updated',
        metadata: {
          updatedFields: Object.keys(req.body)
        }
      });
      
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update employee' });
    }
  });

  // System routes
  app.get('/api/systems', async (req, res) => {
    try {
      const systems = await storage.getSystems();
      res.json(systems);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch systems' });
    }
  });

  app.get('/api/systems/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid system ID' });
      }
      
      const system = await storage.getSystemById(id);
      if (!system) {
        return res.status(404).json({ message: 'System not found' });
      }
      
      res.json(system);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch system' });
    }
  });

  app.post('/api/systems', async (req, res) => {
    try {
      const validationResult = insertSystemSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid system data', errors: validationResult.error.errors });
      }
      
      const system = await storage.createSystem(validationResult.data);
      res.status(201).json(system);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create system' });
    }
  });

  // System Access routes
  app.get('/api/system-access', async (req, res) => {
    try {
      const accessEntries = await storage.getSystemAccessEntries();
      
      // Fetch related data for each access entry
      const accessEntriesWithDetails = await Promise.all(
        accessEntries.map(async (entry) => {
          const system = await storage.getSystemById(entry.systemId);
          const employee = await storage.getEmployeeById(entry.employeeId);
          const grantedBy = entry.grantedById 
            ? await storage.getEmployeeById(entry.grantedById) 
            : null;
            
          return {
            ...entry,
            system: system ? {
              id: system.id,
              name: system.name
            } : null,
            employee: employee ? {
              id: employee.id,
              name: `${employee.firstName} ${employee.lastName}`,
              position: employee.position,
              department: employee.departmentId
            } : null,
            grantedBy: grantedBy ? {
              id: grantedBy.id,
              name: `${grantedBy.firstName} ${grantedBy.lastName}`
            } : null
          };
        })
      );
      
      res.json(accessEntriesWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch system access entries' });
    }
  });

  app.get('/api/system-access/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid access ID' });
      }
      
      const access = await storage.getSystemAccessById(id);
      if (!access) {
        return res.status(404).json({ message: 'System access entry not found' });
      }
      
      // Get related details
      const system = await storage.getSystemById(access.systemId);
      const employee = await storage.getEmployeeById(access.employeeId);
      const grantedBy = access.grantedById 
        ? await storage.getEmployeeById(access.grantedById) 
        : null;
        
      res.json({
        ...access,
        system: system ? {
          id: system.id,
          name: system.name,
          description: system.description
        } : null,
        employee: employee ? {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employee.position
        } : null,
        grantedBy: grantedBy ? {
          id: grantedBy.id,
          name: `${grantedBy.firstName} ${grantedBy.lastName}`
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch system access details' });
    }
  });

  app.post('/api/system-access', async (req, res) => {
    try {
      const validationResult = insertSystemAccessSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid system access data', errors: validationResult.error.errors });
      }
      
      const systemAccess = await storage.createSystemAccess(validationResult.data);
      
      // Create activity for system access request
      const employee = await storage.getEmployeeById(systemAccess.employeeId);
      const system = await storage.getSystemById(systemAccess.systemId);
      
      await storage.createActivity({
        employeeId: systemAccess.employeeId,
        activityType: 'system_access',
        description: `Requested access to ${system?.name || 'system'}`,
        metadata: {
          accessId: systemAccess.id,
          systemId: systemAccess.systemId,
          accessLevel: systemAccess.accessLevel
        }
      });
      
      res.status(201).json(systemAccess);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create system access entry' });
    }
  });

  app.patch('/api/system-access/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid access ID' });
      }
      
      const validationSchema = insertSystemAccessSchema.partial();
      const validationResult = validationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid system access data', errors: validationResult.error.errors });
      }
      
      const updatedAccess = await storage.updateSystemAccess(id, validationResult.data);
      if (!updatedAccess) {
        return res.status(404).json({ message: 'System access entry not found' });
      }
      
      // Create activity if access status changed to granted
      if (req.body.granted === true && req.body.status === 'active') {
        const employee = await storage.getEmployeeById(updatedAccess.employeeId);
        const system = await storage.getSystemById(updatedAccess.systemId);
        
        await storage.createActivity({
          employeeId: updatedAccess.employeeId,
          activityType: 'system_access',
          description: `Access granted to ${system?.name || 'system'}`,
          metadata: {
            accessId: updatedAccess.id,
            systemId: updatedAccess.systemId,
            grantedById: updatedAccess.grantedById
          }
        });
      }
      
      res.json(updatedAccess);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update system access entry' });
    }
  });

  // Ticket routes
  app.get('/api/tickets', async (req, res) => {
    try {
      const tickets = await storage.getTickets();
      
      // Fetch related data for each ticket
      const ticketsWithDetails = await Promise.all(
        tickets.map(async (ticket) => {
          const requestor = await storage.getEmployeeById(ticket.requestorId);
          const assignee = ticket.assigneeId 
            ? await storage.getEmployeeById(ticket.assigneeId) 
            : null;
          const system = ticket.systemId 
            ? await storage.getSystemById(ticket.systemId) 
            : null;
            
          return {
            ...ticket,
            requestor: requestor ? {
              id: requestor.id,
              firstName: requestor.firstName,
              lastName: requestor.lastName,
              position: requestor.position,
              avatar: requestor.avatar
            } : null,
            assignee: assignee ? {
              id: assignee.id,
              firstName: assignee.firstName,
              lastName: assignee.lastName,
              position: assignee.position,
              avatar: assignee.avatar
            } : null,
            system: system ? {
              id: system.id,
              name: system.name,
              description: system.description
            } : null
          };
        })
      );
      
      res.json(ticketsWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  // Get tickets assigned to an employee
  app.get('/api/tickets/assigned/:employeeId', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const tickets = await storage.getTicketsByAssigneeId(employeeId);
      
      // Fetch related data for each ticket
      const ticketsWithDetails = await Promise.all(
        tickets.map(async (ticket) => {
          const requestor = await storage.getEmployeeById(ticket.requestorId);
          const system = ticket.systemId 
            ? await storage.getSystemById(ticket.systemId) 
            : null;
            
          // For metadata fields like position, we need to translate IDs to names
          let enhancedMetadata = ticket.metadata || {};
          
          if (ticket.type === 'new_staff_request' && ticket.metadata) {
            if (ticket.metadata.positionId) {
              const position = await storage.getPositionById(ticket.metadata.positionId);
              if (position) {
                enhancedMetadata = {
                  ...enhancedMetadata,
                  position: position
                };
              }
            }
            
            if (ticket.metadata.departmentId) {
              const department = await storage.getDepartmentById(ticket.metadata.departmentId);
              if (department) {
                enhancedMetadata = {
                  ...enhancedMetadata,
                  department: department
                };
              }
            }
          }
          
          return {
            ...ticket,
            metadata: enhancedMetadata,
            requestor: requestor ? {
              id: requestor.id,
              firstName: requestor.firstName,
              lastName: requestor.lastName,
              position: requestor.position,
              avatar: requestor.avatar
            } : null,
            system: system ? {
              id: system.id,
              name: system.name,
              description: system.description
            } : null
          };
        })
      );
      
      res.json(ticketsWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assigned tickets' });
    }
  });

  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const ticket = await storage.getTicketById(id);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Get related details
      const requestor = await storage.getEmployeeById(ticket.requestorId);
      const assignee = ticket.assigneeId 
        ? await storage.getEmployeeById(ticket.assigneeId) 
        : null;
      const system = ticket.systemId 
        ? await storage.getSystemById(ticket.systemId) 
        : null;
        
      res.json({
        ...ticket,
        requestor: requestor ? {
          id: requestor.id,
          firstName: requestor.firstName,
          lastName: requestor.lastName,
          avatar: requestor.avatar,
          position: requestor.position,
          department: requestor.departmentId
        } : null,
        assignee: assignee ? {
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
          avatar: assignee.avatar,
          position: assignee.position
        } : null,
        system: system ? {
          id: system.id,
          name: system.name,
          description: system.description
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch ticket details' });
    }
  });

  app.post('/api/tickets', async (req, res) => {
    try {
      const validationResult = insertTicketSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid ticket data', errors: validationResult.error.errors });
      }
      
      const ticket = await storage.createTicket(validationResult.data);
      
      // Create activity for ticket creation
      const employee = await storage.getEmployeeById(ticket.requestorId);
      
      await storage.createActivity({
        employeeId: ticket.requestorId,
        activityType: 'ticket',
        description: `Created a new ticket: ${ticket.title}`,
        metadata: {
          ticketId: ticket.id,
          ticketType: ticket.type
        }
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  });

  app.patch('/api/tickets/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const validationSchema = insertTicketSchema.partial();
      const validationResult = validationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid ticket data', errors: validationResult.error.errors });
      }
      
      // Get existing ticket to check for status changes
      const existingTicket = await storage.getTicketById(id);
      if (!existingTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Add closedAt timestamp if status is being set to closed for the first time
      let updateData = {...validationResult.data};
      if (updateData.status === 'closed' && existingTicket.status !== 'closed') {
        updateData.closedAt = new Date().toISOString();
      }
      
      const updatedTicket = await storage.updateTicket(id, updateData);
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Create activity for assignee change
      if (updateData.assigneeId && 
          (!existingTicket.assigneeId || existingTicket.assigneeId !== updateData.assigneeId)) {
        await storage.createActivity({
          employeeId: updateData.assigneeId,
          activityType: 'ticket',
          description: `Assigned to ticket: ${updatedTicket.title}`,
          metadata: {
            ticketId: updatedTicket.id,
            assignedById: updateData.assigneeId
          }
        });
      }
      
      // Create activity for status change to closed
      if (updateData.status === 'closed' && existingTicket.status !== 'closed') {
        await storage.createActivity({
          employeeId: updatedTicket.requestorId,
          activityType: 'ticket',
          description: `Ticket closed: ${updatedTicket.title}`,
          metadata: {
            ticketId: updatedTicket.id,
            closedById: updatedTicket.assigneeId
          }
        });
      }
      
      // Get additional data for response
      const requestor = await storage.getEmployeeById(updatedTicket.requestorId);
      const assignee = updatedTicket.assigneeId 
        ? await storage.getEmployeeById(updatedTicket.assigneeId) 
        : null;
      const system = updatedTicket.systemId 
        ? await storage.getSystemById(updatedTicket.systemId) 
        : null;
        
      res.json({
        ...updatedTicket,
        requestor: requestor ? {
          id: requestor.id,
          firstName: requestor.firstName,
          lastName: requestor.lastName,
          avatar: requestor.avatar,
          position: requestor.position
        } : null,
        assignee: assignee ? {
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
          avatar: assignee.avatar,
          position: assignee.position
        } : null,
        system: system ? {
          id: system.id,
          name: system.name,
          description: system.description
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update ticket' });
    }
  });

  // Activity routes
  app.get('/api/activities', async (req, res) => {
    try {
      const activities = await storage.getActivities();
      
      // Fetch employee details for each activity
      const activitiesWithEmployee = await Promise.all(
        activities.map(async (activity) => {
          const employee = await storage.getEmployeeById(activity.employeeId);
          return {
            ...activity,
            employee: employee ? {
              id: employee.id,
              name: `${employee.firstName} ${employee.lastName}`,
              avatar: employee.avatar,
              position: employee.position
            } : null
          };
        })
      );
      
      res.json(activitiesWithEmployee);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  app.post('/api/activities', async (req, res) => {
    try {
      const validationResult = insertActivitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid activity data', errors: validationResult.error.errors });
      }
      
      const activity = await storage.createActivity(validationResult.data);
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create activity' });
    }
  });

  // Permission routes
  app.get('/api/permissions', async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  app.get('/api/permissions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const permission = await storage.getPermissionById(id);
      
      if (!permission) {
        return res.status(404).json({ message: 'Permission not found' });
      }
      
      res.json(permission);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permission' });
    }
  });

  app.get('/api/permissions/resource/:resource', async (req, res) => {
    try {
      const resource = req.params.resource;
      const permissions = await storage.getPermissionsByResource(resource);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permissions for resource' });
    }
  });

  app.post('/api/permissions', async (req, res) => {
    try {
      const validationResult = insertPermissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid permission data', errors: validationResult.error.errors });
      }
      
      const permission = await storage.createPermission(validationResult.data);
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create permission' });
    }
  });

  app.patch('/api/permissions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertPermissionSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid permission data', errors: validationResult.error.errors });
      }
      
      const updatedPermission = await storage.updatePermission(id, validationResult.data);
      
      if (!updatedPermission) {
        return res.status(404).json({ message: 'Permission not found' });
      }
      
      res.json(updatedPermission);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update permission' });
    }
  });

  app.delete('/api/permissions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePermission(id);
      
      if (!deleted) {
        return res.status(400).json({ message: 'Cannot delete permission that is in use' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete permission' });
    }
  });

  // Role routes
  app.get('/api/roles', async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.get('/api/roles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getRoleById(id);
      
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch role' });
    }
  });

  app.post('/api/roles', async (req, res) => {
    try {
      const validationResult = insertRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid role data', errors: validationResult.error.errors });
      }
      
      const role = await storage.createRole(validationResult.data);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create role' });
    }
  });

  app.patch('/api/roles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertRoleSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid role data', errors: validationResult.error.errors });
      }
      
      const updatedRole = await storage.updateRole(id, validationResult.data);
      
      if (!updatedRole) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  app.delete('/api/roles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRole(id);
      
      if (!deleted) {
        return res.status(400).json({ message: 'Cannot delete role that is assigned to employees' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete role' });
    }
  });

  // Role Permission routes
  app.get('/api/roles/:roleId/permissions', async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissions = await storage.getRolePermissions(roleId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch role permissions' });
    }
  });

  app.post('/api/roles/:roleId/permissions', async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const { permissionId } = req.body;
      
      if (!permissionId) {
        return res.status(400).json({ message: 'Permission ID is required' });
      }
      
      const rolePermissionData = {
        roleId,
        permissionId: parseInt(permissionId)
      };
      
      const rolePermission = await storage.addPermissionToRole(rolePermissionData);
      res.status(201).json(rolePermission);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to add permission to role' });
    }
  });

  app.delete('/api/roles/:roleId/permissions/:permissionId', async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      
      const deleted = await storage.removePermissionFromRole(roleId, permissionId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Role permission not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove permission from role' });
    }
  });

  // Staff Import route
  app.post('/api/employees/import', async (req, res) => {
    try {
      const { employees, focusLMS } = req.body;
      
      // Check if import feature is enabled
      const featureFlags = {
        staffImport: { enabled: true },
        focusLMS: true
      };
      
      if (!featureFlags.staffImport.enabled) {
        return res.status(403).json({ 
          message: 'Staff import feature is currently disabled',
          total: 0,
          successful: 0,
          failed: 0,
          errors: ['Feature disabled']
        });
      }
      
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ 
          message: 'Invalid import data. Expected an array of employee records.',
          total: 0,
          successful: 0,
          failed: 0,
          errors: ['No employee records provided']
        });
      }
      
      // Process each employee record
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];
      
      for (const employeeData of employees) {
        try {
          // Validate required fields
          const requiredFields = ['firstName', 'lastName', 'email', 'position', 'departmentId'];
          const missingFields = requiredFields.filter(field => !employeeData[field]);
          
          if (missingFields.length > 0) {
            failed++;
            errors.push(`Missing required fields for ${employeeData.email || 'an employee'}: ${missingFields.join(', ')}`);
            continue;
          }
          
          // Process dates if provided
          if (employeeData.hireDate && typeof employeeData.hireDate === 'string') {
            employeeData.hireDate = new Date(employeeData.hireDate);
            
            if (isNaN(employeeData.hireDate.getTime())) {
              employeeData.hireDate = new Date(); // Default to current date if invalid
            }
          } else {
            employeeData.hireDate = new Date(); // Default hire date
          }
          
          // Set default values for optional fields
          if (!employeeData.status) {
            employeeData.status = 'active';
          }
          
          // Create the employee
          const newEmployee = await storage.createEmployee(employeeData);
          successful++;
          
          // If focusLMS is enabled and LMS status is provided, create LMS training record
          if (featureFlags.focusLMS && newEmployee && employeeData.lmsStatus) {
            // Create a system access entry for Health Carousel Academy LMS
            await storage.createSystemAccess({
              employeeId: newEmployee.id,
              systemId: 1, // Assuming system ID 1 is for Health Carousel Academy
              accessLevel: 'user',
              status: employeeData.lmsStatus === 'completed' ? 'active' : 'pending',
              granted: employeeData.lmsStatus === 'completed',
              grantedById: 1, // Admin user
              grantedAt: employeeData.lmsStatus === 'completed' ? new Date() : null,
              expiresAt: null
            });
            
            // Create activity for LMS status
            await storage.createActivity({
              employeeId: newEmployee.id,
              activityType: 'system_access',
              description: `Health Carousel Academy training status: ${employeeData.lmsStatus}`,
              metadata: {
                systemId: 1,
                status: employeeData.lmsStatus
              }
            });
          }
          
          // Create activity for new employee
          await storage.createActivity({
            employeeId: newEmployee.id,
            activityType: 'onboarding',
            description: `Employee imported via ${employeeData.fileType || 'file'}: ${employeeData.firstName} ${employeeData.lastName}`,
            metadata: {
              importMethod: employeeData.fileType || 'import',
              departmentId: employeeData.departmentId,
              position: employeeData.position
            }
          });
          
        } catch (error: any) {
          failed++;
          errors.push(`Error importing ${employeeData.email || 'an employee'}: ${error.message || 'Unknown error'}`);
        }
      }
      
      res.status(200).json({
        message: `Import complete. Successfully imported ${successful} of ${employees.length} employees.`,
        total: employees.length,
        successful,
        failed,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Import process failed',
        error: error.message,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [error.message || 'Unknown server error']
      });
    }
  });

  // Employee Role routes
  app.get('/api/employees/:employeeId/roles', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const roles = await storage.getEmployeeRoles(employeeId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee roles' });
    }
  });

  app.post('/api/employees/:employeeId/roles', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const { roleId, assignedBy } = req.body;
      
      if (!roleId || !assignedBy) {
        return res.status(400).json({ message: 'Role ID and assigned by are required' });
      }
      
      const employeeRoleData = {
        employeeId,
        roleId: parseInt(roleId),
        assignedBy: parseInt(assignedBy)
      };
      
      const employeeRole = await storage.addRoleToEmployee(employeeRoleData);
      res.status(201).json(employeeRole);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to add role to employee' });
    }
  });

  app.delete('/api/employees/:employeeId/roles/:roleId', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const roleId = parseInt(req.params.roleId);
      
      const deleted = await storage.removeRoleFromEmployee(employeeId, roleId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Employee role not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove role from employee' });
    }
  });

  // Permission check routes
  app.get('/api/employees/:employeeId/permissions/:resource/:action', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const resource = req.params.resource;
      const action = req.params.action;
      
      const hasPermission = await storage.hasPermission(employeeId, resource, action);
      res.json({ hasPermission });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check permission' });
    }
  });

  app.get('/api/employees/:employeeId/field-permissions/:resource', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const resource = req.params.resource;
      
      const fieldPermissions = await storage.getFieldLevelPermissions(employeeId, resource);
      res.json({ fieldPermissions });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get field-level permissions' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
