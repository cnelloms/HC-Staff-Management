import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = 
  | "open" 
  | "in_progress" 
  | "closed" 
  | "pending" 
  | "active" 
  | "revoked" 
  | "onboarding"
  | "low"
  | "medium"
  | "high";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  // Default to 'pending' if status is invalid or undefined
  const validStatus = (status && ['pending', 'open', 'in_progress', 'active', 'closed', 'revoked', 'onboarding', 'low', 'medium', 'high'].includes(status)) 
    ? status 
    : 'pending';

  const badgeClasses = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    open: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    active: "bg-green-100 text-green-800 hover:bg-green-100",
    closed: "bg-green-100 text-green-800 hover:bg-green-100",
    revoked: "bg-red-100 text-red-800 hover:bg-red-100",
    onboarding: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    low: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    high: "bg-red-100 text-red-800 hover:bg-red-100",
  };

  const badgeLabels = {
    pending: "Pending",
    open: "Open",
    in_progress: "In Progress",
    active: "Active",
    closed: "Completed",
    revoked: "Revoked",
    onboarding: "Onboarding",
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-semibold border-none",
        badgeClasses[validStatus],
        className
      )}
    >
      {label || badgeLabels[validStatus]}
    </Badge>
  );
}
