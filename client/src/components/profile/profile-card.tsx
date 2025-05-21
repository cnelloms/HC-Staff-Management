import React from "react";
import { useProfileData, getInitials, getFullName } from "@/hooks/useProfileData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface ProfileCardProps {
  userId?: string;
  employeeId?: number;
  showDetailsLink?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Reusable profile card component that displays user/employee information consistently
 * across the application with proper data synchronization
 */
export function ProfileCard({
  userId,
  employeeId,
  showDetailsLink = true,
  compact = false,
  className = "",
}: ProfileCardProps) {
  const { profileData, isLoading, error } = useProfileData(userId, employeeId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="space-y-2 pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profileData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Profile Unavailable</CardTitle>
          <CardDescription>We couldn't load the profile information at this time.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const initials = getInitials(profileData.firstName, profileData.lastName);
  const fullName = getFullName(profileData.firstName, profileData.lastName);

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileData.avatar} alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{fullName}</p>
              <p className="text-xs text-muted-foreground">
                {profileData.position || profileData.department || profileData.username}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          {profileData.employeeId ? "Staff Member" : "User Account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar} alt={fullName} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {profileData.employeeId ? 'Employee ID: ' + profileData.employeeId : 'User'}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <h3 className="font-medium text-sm">Name</h3>
                <p>{fullName}</p>
              </div>
              
              {profileData.username && (
                <div>
                  <h3 className="font-medium text-sm">Username</h3>
                  <p>{profileData.username}</p>
                </div>
              )}
              
              {profileData.email && (
                <div>
                  <h3 className="font-medium text-sm">Email</h3>
                  <p>{profileData.email}</p>
                </div>
              )}
              
              {profileData.phone && (
                <div>
                  <h3 className="font-medium text-sm">Phone</h3>
                  <p>{profileData.phone}</p>
                </div>
              )}
              
              {profileData.position && (
                <div>
                  <h3 className="font-medium text-sm">Position</h3>
                  <p>{typeof profileData.position === 'object' && 'title' in profileData.position 
                    ? profileData.position.title 
                    : (typeof profileData.position === 'string' ? profileData.position : 'Unknown')}
                  </p>
                </div>
              )}
              
              {profileData.department && (
                <div>
                  <h3 className="font-medium text-sm">Department</h3>
                  <p>{typeof profileData.department === 'object' && 'name' in profileData.department 
                    ? profileData.department.name 
                    : (typeof profileData.department === 'string' ? profileData.department : 'Unknown')}
                  </p>
                </div>
              )}
              
              {profileData.status && (
                <div>
                  <h3 className="font-medium text-sm">Status</h3>
                  <p className="capitalize">{profileData.status}</p>
                </div>
              )}
            </div>
            
            {showDetailsLink && profileData.employeeId && (
              <div className="mt-4 pt-4 border-t">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/employee/${profileData.employeeId}`}>View Full Profile</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}