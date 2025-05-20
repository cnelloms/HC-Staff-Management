import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon } from "lucide-react";
import { FaMicrosoft } from "react-icons/fa";

export function AuthOptions() {
  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  const handleMicrosoftLogin = () => {
    window.location.href = "/api/login/microsoft";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Choose your preferred authentication method
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Replit login option removed as we're using direct auth now */}
        
        <Button 
          disabled
          className="w-full flex items-center justify-center"
          variant="outline"
        >
          <FaMicrosoft className="mr-2 h-4 w-4" />
          Sign in with Microsoft (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}