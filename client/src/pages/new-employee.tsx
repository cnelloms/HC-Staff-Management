import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { StaffForm } from "@/components/staff/staff-form";
import { Employee } from "@/types";

export default function NewEmployee() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? parseInt(id) : undefined;
  const isEditing = !!employeeId;
  
  // Only fetch employee data if we're in edit mode
  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: employeeId ? [`/api/employees/${employeeId}`] : null,
    enabled: !!employeeId
  });
  
  const title = isEditing ? "Edit Employee" : "Add New Employee";
  
  return (
    <Layout title={title}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-6">{title}</h2>
        {isEditing && isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <StaffForm 
            employeeId={employeeId} 
            defaultValues={employee}
          />
        )}
      </div>
    </Layout>
  );
}
