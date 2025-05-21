import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/types";

export default function TestLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("cnelloms");
  const [password, setPassword] = useState("password");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Get employees for selection
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Prefill from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get("employee");
    if (employeeId) {
      setSelectedEmployee(employeeId);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        toast({
          title: "Login successful",
          description: "You are now logged in",
        });
        
        // Redirect to home page or specific employee's profile
        if (selectedEmployee) {
          navigate(`/employee/${selectedEmployee}`);
        } else {
          navigate("/");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/20">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Profile Test Login</CardTitle>
          <CardDescription>
            Use this form to test the profile data synchronization with various users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">View Employee Profile (Optional)</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee to view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (go to dashboard)</SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                After login, you'll be redirected to this employee's profile
              </p>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Default Admin:</strong> Username: cnelloms | Password: password
            </p>
            <p>
              <strong>Note:</strong> This is for testing profile data synchronization only
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}