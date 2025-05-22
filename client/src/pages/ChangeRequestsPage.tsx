import { PageHeader } from "@/components/PageHeader";
import ApprovalInbox from "@/components/ApprovalInbox";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function ChangeRequestsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check if user has a role property with "manager" or is admin
  const userRoles = (useAuth().user as any)?.roles || [];
  const isManager = userRoles.includes("manager") || isAdmin;

  // Only admins and managers should have access to this page
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (!isManager && !isAdmin) {
    setLocation("/unauthorized");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Change Request Approvals" 
        description="Review and approve change requests from your team members"
      />
      
      <div className="mt-8">
        <ApprovalInbox />
      </div>
    </div>
  );
}

export default ChangeRequestsPage;