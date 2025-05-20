import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Employee, Ticket } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UserPlus, User, Users, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface OrgNodeProps {
  employee: Employee;
  subordinates: Employee[];
  pendingRequests: Ticket[];
  level: number;
  expanded: Record<number, boolean>;
  toggleExpand: (id: number) => void;
}

const OrgNode: React.FC<OrgNodeProps> = ({ 
  employee, 
  subordinates, 
  pendingRequests,
  level,
  expanded,
  toggleExpand
}) => {
  // Find pending requests for direct reports to this manager
  const nodeRequests = useMemo(() => {
    return pendingRequests.filter(request => {
      const metadata = request.metadata || {};
      return metadata.reportingManagerId === employee.id;
    });
  }, [pendingRequests, employee.id]);

  // Check if this node has any content to expand
  const hasExpandableContent = subordinates.length > 0 || nodeRequests.length > 0;
  
  // Calculate left margin based on level
  const marginLeft = level * 40;
  const isExpanded = expanded[employee.id] || false;

  return (
    <div className="mb-6">
      <div 
        className="border rounded-md p-4 bg-background hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${marginLeft}px` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {hasExpandableContent && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => toggleExpand(employee.id)}
              >
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            )}
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
              <AvatarFallback>{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                <Link href={`/employee/${employee.id}`}>
                  {employee.firstName} {employee.lastName}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">{employee.position}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {subordinates.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {subordinates.length}
              </Badge>
            )}
            <StatusBadge status={employee.status as any} className="capitalize" />
          </div>
        </div>
      </div>

      {/* Render pending staff requests for this manager */}
      {isExpanded && nodeRequests.length > 0 && (
        <div className="ml-10 mt-2 space-y-2">
          {nodeRequests.map(request => {
            const metadata = request.metadata || {};
            return (
              <div 
                key={request.id} 
                className="border border-dashed border-orange-300 rounded-md p-3 bg-orange-50 dark:bg-orange-950/20"
                style={{ marginLeft: `${marginLeft + 30}px` }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full">
                    <UserPlus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      <Link href={`/tickets/${request.id}`}>
                        {metadata.firstName} {metadata.lastName}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">Pending New Staff</div>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={request.status as any} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Render subordinates recursively */}
      {isExpanded && subordinates.length > 0 && (
        <div className="ml-10 mt-2 space-y-2">
          {subordinates.map(subordinate => (
            <OrgNode 
              key={subordinate.id}
              employee={subordinate}
              subordinates={subordinate.subordinates || []}
              pendingRequests={pendingRequests}
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function OrgChart() {
  const [expandedNodes, setExpandedNodes] = React.useState<Record<number, boolean>>({});
  const [showOnlyManagersWithPending, setShowOnlyManagersWithPending] = React.useState(false);

  // Fetch employees
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Fetch pending new staff request tickets
  const { data: tickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  // Find top-level managers (employees without a manager)
  const topLevelManagers = useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => !emp.managerId);
  }, [employees]);

  // Filter pending new staff requests
  const pendingNewStaffRequests = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(
      ticket => ticket.type === 'new_staff_request' && ticket.status !== 'closed'
    );
  }, [tickets]);
  
  // Organize employees into a hierarchical structure
  const organizationHierarchy = useMemo(() => {
    if (!employees) return topLevelManagers;

    // Create a map of employees with their subordinates
    const employeeMap = new Map<number, Employee & { subordinates: Employee[] }>();
    
    // Initialize the map with all employees and empty subordinates arrays
    employees.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, subordinates: [] });
    });
    
    // Populate subordinates for each employee
    employees.forEach(emp => {
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const manager = employeeMap.get(emp.managerId);
        if (manager) {
          manager.subordinates.push(employeeMap.get(emp.id) || emp);
        }
      }
    });
    
    // Return the top-level managers with their subordinates
    let result = topLevelManagers.map(manager => employeeMap.get(manager.id) || manager);
    
    // If showing only managers with pending staff, filter the hierarchy
    if (showOnlyManagersWithPending && pendingNewStaffRequests.length > 0) {
      // Get all manager IDs that have pending staff requests
      const managerIdsWithPending = new Set(
        pendingNewStaffRequests
          .filter(request => request.metadata?.reportingManagerId)
          .map(request => request.metadata.reportingManagerId)
      );
      
      // Filter to only include managers with pending staff or their ancestors
      const hasRelevantSubordinates = (employee: any): boolean => {
        // Check if this employee is a manager with pending staff
        if (managerIdsWithPending.has(employee.id)) {
          return true;
        }
        
        // Check if any subordinates have pending staff
        if (employee.subordinates && employee.subordinates.length > 0) {
          return employee.subordinates.some(hasRelevantSubordinates);
        }
        
        return false;
      };
      
      // Apply the filter to the hierarchy
      result = result.filter(hasRelevantSubordinates);
    }
    
    return result;
  }, [employees, topLevelManagers, pendingNewStaffRequests, showOnlyManagersWithPending]);

  // Toggle expanded state of nodes
  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Expand all nodes
  const expandAll = () => {
    const expandedState: Record<number, boolean> = {};
    if (employees) {
      employees.forEach(emp => {
        expandedState[emp.id] = true;
      });
    }
    setExpandedNodes(expandedState);
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes({});
  };

  if (isLoadingEmployees || isLoadingTickets) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-60">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">Loading organization chart...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3.5 w-3.5 mr-1" />
            {employees?.length || 0} Employees
          </Badge>
          
          {pendingNewStaffRequests.length > 0 && (
            <Badge 
              variant="outline" 
              className={`gap-1 cursor-pointer transition-all ${
                showOnlyManagersWithPending 
                  ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700"
                  : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800"
              } hover:bg-orange-100 hover:text-orange-800 hover:border-orange-300 dark:hover:bg-orange-900/40 dark:hover:text-orange-300 dark:hover:border-orange-700`}
              onClick={() => {
                // Toggle the filter
                setShowOnlyManagersWithPending(!showOnlyManagersWithPending);
                
                // If enabling the filter, expand all nodes to make the filtered view more useful
                if (!showOnlyManagersWithPending) {
                  expandAll();
                }
              }}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              {pendingNewStaffRequests.length} Pending
              {showOnlyManagersWithPending && <span className="ml-1">(filtered)</span>}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
          {showOnlyManagersWithPending && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/40"
              onClick={() => setShowOnlyManagersWithPending(false)}
            >
              Show All
            </Button>
          )}
        </div>
      </div>

      {organizationHierarchy.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-medium">No organization structure found</h3>
          <p className="text-muted-foreground mt-1">
            There are no employees or the organization structure is not defined.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {organizationHierarchy.map(manager => (
            <OrgNode 
              key={manager.id}
              employee={manager}
              subordinates={(manager as any).subordinates || []}
              pendingRequests={pendingNewStaffRequests}
              level={0}
              expanded={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}