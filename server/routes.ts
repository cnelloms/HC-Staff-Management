import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDepartmentSchema, insertEmployeeSchema, insertSystemSchema, 
  insertSystemAccessSchema, insertTicketSchema, insertActivitySchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
              name: `${requestor.firstName} ${requestor.lastName}`,
              avatar: requestor.avatar
            } : null,
            assignee: assignee ? {
              id: assignee.id,
              name: `${assignee.firstName} ${assignee.lastName}`,
              avatar: assignee.avatar
            } : null,
            system: system ? {
              id: system.id,
              name: system.name
            } : null
          };
        })
      );
      
      res.json(ticketsWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tickets' });
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
          name: `${requestor.firstName} ${requestor.lastName}`,
          avatar: requestor.avatar,
          position: requestor.position,
          department: requestor.departmentId
        } : null,
        assignee: assignee ? {
          id: assignee.id,
          name: `${assignee.firstName} ${assignee.lastName}`,
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
      
      // Add closedAt timestamp if status is being set to closed
      let updateData = validationResult.data;
      if (updateData.status === 'closed') {
        updateData = { ...updateData, closedAt: new Date() };
      }
      
      const updatedTicket = await storage.updateTicket(id, updateData);
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Create activity for ticket update
      if (updatedTicket.assigneeId && req.body.assigneeId && updatedTicket.assigneeId !== req.body.assigneeId) {
        const assignee = await storage.getEmployeeById(updatedTicket.assigneeId);
        
        await storage.createActivity({
          employeeId: updatedTicket.assigneeId,
          activityType: 'ticket',
          description: `Assigned to ticket: ${updatedTicket.title}`,
          metadata: {
            ticketId: updatedTicket.id,
            assignedById: req.body.assigneeId
          }
        });
      }
      
      if (req.body.status === 'closed') {
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
      
      res.json(updatedTicket);
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

  const httpServer = createServer(app);
  return httpServer;
}
