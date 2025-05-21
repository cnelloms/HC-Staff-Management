import React from "react";
import { useProfileData, getInitials } from "@/hooks/useProfileData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { 
  User, Settings, LogOut, Building, 
  LayoutDashboard, Briefcase, ShieldCheck 
} from "lucide-react";

/**
 * Profile header component with dropdown menu for site header
 * Ensures consistent display of profile data
 */
export function ProfileHeader() {
  const { profileData, isLoading } = useProfileData();
  
  // Show empty state while loading
  if (isLoading || !profileData) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  const initials = getInitials(profileData.firstName, profileData.lastName);
  const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'User';
  
  // Handle position/department that could be objects
  let positionDisplay = '';
  if (profileData.position) {
    positionDisplay = typeof profileData.position === 'object' && 'title' in profileData.position 
      ? profileData.position.title 
      : (typeof profileData.position === 'string' ? profileData.position : '');
  }
  
  let departmentDisplay = '';
  if (profileData.department) {
    departmentDisplay = typeof profileData.department === 'object' && 'name' in profileData.department
      ? profileData.department.name
      : (typeof profileData.department === 'string' ? profileData.department : '');
  }
  
  const positionOrDepartment = positionDisplay || departmentDisplay || (profileData.isAdmin ? 'Administrator' : 'User');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none focus:ring-2 focus:ring-primary/50">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={profileData.avatar} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start mr-1 text-left">
            <span className="text-sm font-medium truncate max-w-[150px]">{fullName}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {positionOrDepartment}
              {profileData.isAdmin && <span className="ml-1 text-primary">(Admin)</span>}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profileData.email || profileData.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <a href="/profile">
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
        </a>
        
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        
        {profileData.employeeId && (
          <Link href={`/employee/${profileData.employeeId}`}>
            <DropdownMenuItem className="cursor-pointer">
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Employee Record</span>
            </DropdownMenuItem>
          </Link>
        )}
        
        <DropdownMenuSeparator />
        
        <Link href="/">
          <DropdownMenuItem className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/directory">
          <DropdownMenuItem className="cursor-pointer">
            <Building className="mr-2 h-4 w-4" />
            <span>Staff Directory</span>
          </DropdownMenuItem>
        </Link>
        
        {profileData.isAdmin && (
          <Link href="/admin">
            <DropdownMenuItem className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Admin Console</span>
            </DropdownMenuItem>
          </Link>
        )}
        
        <DropdownMenuSeparator />
        
        <a href="/api/logout">
          <DropdownMenuItem className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}