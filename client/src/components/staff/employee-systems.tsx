import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { MonitorSmartphone, Server, Clock, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EmployeeSystemProps {
  employeeId: number;
}

export function EmployeeSystems({ employeeId }: EmployeeSystemProps) {
  const { data: systemAccess, isLoading } = useQuery({
    queryKey: ['/api/employees', employeeId, 'systems'],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/systems`);
      if (!response.ok) {
        throw new Error('Failed to fetch system access');
      }
      return response.json();
    },
    enabled: !!employeeId
  });

  // Function to format date or show placeholder
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  // Function to get access level badge
  const getAccessLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'admin':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800">
            Admin
          </Badge>
        );
      case 'write':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
            Write
          </Badge>
        );
      case 'read':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            Read
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            {level}
          </Badge>
        );
    }
  };

  // Generate system icon based on category
  const getSystemIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'hr':
        return <Avatar className="h-8 w-8 bg-blue-100 text-blue-600"><AvatarFallback>HR</AvatarFallback></Avatar>;
      case 'finance':
        return <Avatar className="h-8 w-8 bg-green-100 text-green-600"><AvatarFallback>FN</AvatarFallback></Avatar>;
      case 'communication':
        return <Avatar className="h-8 w-8 bg-purple-100 text-purple-600"><AvatarFallback>CM</AvatarFallback></Avatar>;
      case 'sales':
        return <Avatar className="h-8 w-8 bg-yellow-100 text-yellow-600"><AvatarFallback>SL</AvatarFallback></Avatar>;
      case 'operations':
        return <Avatar className="h-8 w-8 bg-orange-100 text-orange-600"><AvatarFallback>OP</AvatarFallback></Avatar>;
      default:
        return <Avatar className="h-8 w-8 bg-gray-100 text-gray-600"><AvatarFallback>SY</AvatarFallback></Avatar>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Server className="h-3.5 w-3.5 mr-1" />
          {systemAccess?.length || 0} System{systemAccess?.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {systemAccess && systemAccess.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Granted Date</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemAccess.map((access: any) => (
              <TableRow key={access.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getSystemIcon(access.system?.category)}
                    <div>
                      <div className="font-medium">{access.system?.name || 'Unknown System'}</div>
                      <div className="text-xs text-muted-foreground">{access.system?.description || ''}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getAccessLevelBadge(access.accessLevel)}</TableCell>
                <TableCell>{getStatusBadge(access.status)}</TableCell>
                <TableCell>{formatDate(access.grantedAt)}</TableCell>
                <TableCell>{formatDate(access.expiresAt) || 'No expiration'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-8 text-center">
          <MonitorSmartphone className="h-10 w-10 mx-auto mb-4 text-muted-foreground/60" />
          <h3 className="text-lg font-medium mb-1">No System Access</h3>
          <p className="text-muted-foreground">This employee has no assigned systems.</p>
        </div>
      )}
    </div>
  );
}