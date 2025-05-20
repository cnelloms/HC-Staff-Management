import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, UserX, UserCheck, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export function ImpersonationPanel() {
  const { isAdmin, isImpersonating, impersonatingEmployee } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isStartingImpersonation, setIsStartingImpersonation] = useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch employees for admin to select from
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
    enabled: isAdmin && !isImpersonating,
  });

  // Handle starting impersonation
  const startImpersonation = async () => {
    if (!selectedEmployeeId) return;
    
    setError(null);
    setIsStartingImpersonation(true);
    
    try {
      const response = await fetch(`/api/impersonate/${selectedEmployeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start impersonation');
      }
      
      // Refetch auth data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Show success message
      const successData = await response.json();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start impersonation');
    } finally {
      setIsStartingImpersonation(false);
    }
  };

  // Handle stopping impersonation
  const stopImpersonation = async () => {
    setError(null);
    setIsStoppingImpersonation(true);
    
    try {
      const response = await fetch('/api/stop-impersonating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to stop impersonation');
      }
      
      // Refetch auth data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (err: any) {
      setError(err.message || 'Failed to stop impersonation');
    } finally {
      setIsStoppingImpersonation(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Employee View Access
        </CardTitle>
        <CardDescription>
          View the system as a specific employee to check their access and experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isImpersonating && impersonatingEmployee ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div>
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 mb-1">
                  Currently viewing as:
                </Badge>
                <div className="font-medium">
                  {impersonatingEmployee.firstName} {impersonatingEmployee.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {impersonatingEmployee.position || 'Employee'}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopImpersonation}
                disabled={isStoppingImpersonation}
                className="text-amber-600 border-amber-300"
              >
                {isStoppingImpersonation ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4 mr-1" />
                )}
                Exit view mode
              </Button>
            </div>
            
            <div className="text-sm">
              While in view mode, you see the system exactly as this employee would. Any actions you take will be logged as being performed by this employee.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium mb-1">Select an employee to view as:</div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedEmployeeId}
                  onValueChange={setSelectedEmployeeId}
                  disabled={isLoading || isStartingImpersonation}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.firstName} {emp.lastName} ({emp.position || 'Employee'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={startImpersonation} 
                  disabled={!selectedEmployeeId || isStartingImpersonation}
                  size="sm"
                >
                  {isStartingImpersonation && <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
                  <UserCheck className="h-4 w-4 mr-1" />
                  Start viewing
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              View mode lets you see the system as if you were logged in as the selected employee, 
              helping you verify appropriate access levels and troubleshoot permission issues.
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}