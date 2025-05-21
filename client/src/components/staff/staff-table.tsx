import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Employee } from "@/types";
import { useState, useMemo } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

export function StaffTable() {
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const departments = useMemo(() => {
    if (!employees) return [];
    
    const deptMap = new Map();
    employees.forEach(emp => {
      if (emp.department) {
        deptMap.set(emp.department.id, emp.department.name);
      }
    });
    
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(employee => {
      const matchesSearch = searchTerm === '' || 
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesDepartment = departmentFilter === 'all' || 
        (employee.department && employee.department.id.toString() === departmentFilter);
        
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-6 w-16 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-36 bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-16 bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No employees found matching the current filters
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                        <AvatarFallback>{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          <Link href={`/employee/${employee.id}`} className="hover:underline">
                              {employee.firstName} {employee.lastName}
                          </Link>
                        </div>
                        <div className="text-sm text-muted-foreground">{employee.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.department?.name || '-'}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={employee.status as any} 
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{employee.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/employee/${employee.id}`}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
