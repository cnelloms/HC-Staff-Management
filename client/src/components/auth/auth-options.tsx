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
        <Button 
          onClick={handleReplitLogin}
          className="w-full flex items-center justify-center"
          variant="outline"
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Continue with Replit
        </Button>
        
        <Button 
          onClick={handleMicrosoftLogin}
          className="w-full flex items-center justify-center"
          variant="default"
        >
          <FaMicrosoft className="mr-2 h-4 w-4" />
          Sign in with Microsoft
        </Button>
      </CardContent>
    </Card>
  );
}