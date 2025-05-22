import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "../components/PageHeader";
import { Loader2, User, Phone, Mail, Building, Calendar } from "lucide-react";

export default function MyProfile() {
  const { toast } = useToast();
  const { user, employee } = useAuth();
  // Define a type for our form data and add an index signature
  type FormDataType = {
    workMobile: string;
    personalEmail: string;
    emergencyContact: string;
    emergencyPhone: string;
    [key: string]: string; // Add index signature for dynamic access
  };
  
  const [formData, setFormData] = useState<FormDataType>({
    workMobile: "",
    personalEmail: "",
    emergencyContact: "",
    emergencyPhone: ""
  });

  // Fetch current employee data
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ["/api/employees/me"],
    queryFn: async () => {
      const response = await fetch("/api/employees/me");
      if (!response.ok) {
        throw new Error("Failed to fetch employee data");
      }
      return response.json();
    },
    enabled: !!user // Only run when user is authenticated
  });

  // Create change request mutation
  const mutation = useMutation({
    mutationFn: async (data: { field: string; value: string }) => {
      if (!employeeData?.id) {
        throw new Error("Employee ID not found");
      }
      
      // Create a payload with just the field being changed
      const payload = { [data.field]: data.value };
      
      const response = await fetch(`/api/employees/${employeeData.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit change request");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Change request submitted",
        description: `Your request to update ${variables.field} has been submitted for approval.`,
        variant: "default"
      });
      
      // Reset the specific field that was submitted
      setFormData(prev => ({
        ...prev,
        [variables.field]: ""
      }));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit change request",
        variant: "destructive"
      });
    }
  });

  const handleSubmitChange = (field: string) => {
    if (!formData[field]) {
      toast({
        title: "Validation Error",
        description: "Please enter a value before submitting",
        variant: "destructive"
      });
      return;
    }
    
    mutation.mutate({ field, value: formData[field] });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Unable to load your profile information. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="My Profile" 
        description="View and request changes to your profile information"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg font-medium">
                  {employeeData.firstName} {employeeData.lastName}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                <p>{employeeData.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p>{employeeData.position?.title || "Not specified"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p>{employeeData.department?.name || "Not specified"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Work Email</p>
                <p>{employeeData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Work Mobile</p>
                <p className="mb-2">{employeeData.workMobile || "Not provided"}</p>
                
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Label htmlFor="workMobile">Request update</Label>
                    <Input
                      id="workMobile"
                      name="workMobile"
                      placeholder="New mobile number"
                      value={formData.workMobile}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button 
                    onClick={() => handleSubmitChange("workMobile")}
                    disabled={mutation.isPending}
                    className="mt-8"
                  >
                    {mutation.isPending && mutation.variables?.field === "workMobile" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Submit
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personal Email</p>
                <p className="mb-2">{employeeData.personalEmail || "Not provided"}</p>
                
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Label htmlFor="personalEmail">Request update</Label>
                    <Input
                      id="personalEmail"
                      name="personalEmail"
                      placeholder="New personal email"
                      value={formData.personalEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button 
                    onClick={() => handleSubmitChange("personalEmail")}
                    disabled={mutation.isPending}
                    className="mt-8"
                  >
                    {mutation.isPending && mutation.variables?.field === "personalEmail" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact Name</p>
                <p className="mb-2">{employeeData.emergencyContact || "Not provided"}</p>
                
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Label htmlFor="emergencyContact">Request update</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      placeholder="New emergency contact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button 
                    onClick={() => handleSubmitChange("emergencyContact")}
                    disabled={mutation.isPending}
                    className="mt-8"
                  >
                    {mutation.isPending && mutation.variables?.field === "emergencyContact" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Submit
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact Phone</p>
                <p className="mb-2">{employeeData.emergencyPhone || "Not provided"}</p>
                
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Label htmlFor="emergencyPhone">Request update</Label>
                    <Input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      placeholder="New emergency phone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button 
                    onClick={() => handleSubmitChange("emergencyPhone")}
                    disabled={mutation.isPending}
                    className="mt-8"
                  >
                    {mutation.isPending && mutation.variables?.field === "emergencyPhone" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}