import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, UserX } from "lucide-react";

async function apiRequest(url: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST', body?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }
  
  return response.json();
}

export function ImpersonationControls() {
  const { isAdmin, isImpersonating, employee, impersonatingEmployee } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isStartingImpersonation, setIsStartingImpersonation] = useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await apiRequest(`/api/impersonate/${selectedEmployeeId}`);
      // Refetch auth data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
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
      await apiRequest('/api/stop-impersonating');
      // Refetch auth data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (err: any) {
      setError(err.message || 'Failed to stop impersonation');
    } finally {
      setIsStoppingImpersonation(false);
    }
  };

  // Show nothing if not admin and not impersonating
  if (!isAdmin && !isImpersonating) {
    return null;
  }

  // Show impersonation active badge
  if (isImpersonating && impersonatingEmployee) {
    return (
      <div className="flex flex-col gap-2 p-2 border rounded-md bg-amber-50">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            Viewing as: {impersonatingEmployee.firstName} {impersonatingEmployee.lastName}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={stopImpersonation}
            disabled={isStoppingImpersonation}
          >
            {isStoppingImpersonation ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <UserX className="h-4 w-4 mr-1" />
            )}
            Exit view
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Show impersonation controls for admins
  return (
    <div className="flex flex-col gap-2 p-3 border rounded-md">
      <div className="text-sm font-medium mb-1">View as employee</div>
      <div className="flex items-center gap-2">
        <Select
          value={selectedEmployeeId}
          onValueChange={setSelectedEmployeeId}
          disabled={isLoading || isStartingImpersonation}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp: Employee) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.firstName} {emp.lastName} ({emp.position})
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
          View
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}