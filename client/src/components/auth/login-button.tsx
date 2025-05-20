import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserIcon, LogOutIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AuthOptions } from "./auth-options";

export function LoginButton({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    window.location.href = "/api/logout";
  };

  if (isAuthenticated) {
    return (
      <Button 
        variant="ghost" 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
      >
        <LogOutIcon className="mr-2 h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    );
  }

  return (
    <Button 
      variant="default" 
      className={className}
      onClick={() => window.location.href = '/login'}
      aria-label="Log in to the system"
    >
      <UserIcon className="mr-2 h-4 w-4" />
      Login
    </Button>
  );
}