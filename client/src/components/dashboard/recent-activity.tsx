import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "@/types";
import { format, formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/recent-activities'],
  });

  const getActivityBadgeType = (type: Activity['activityType']) => {
    switch (type) {
      case 'profile_update': return 'active';
      case 'system_access': return 'pending';
      case 'ticket': return 'in_progress';
      case 'onboarding': return 'onboarding';
      default: return 'pending';
    }
  };

  const getActivityBadgeLabel = (type: Activity['activityType']) => {
    switch (type) {
      case 'profile_update': return 'Profile Update';
      case 'system_access': return 'Access Request';
      case 'ticket': return 'IT Support';
      case 'onboarding': return 'Onboarding';
      default: return type;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const isToday = new Date().toDateString() === date.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Recent Employee Activity</CardTitle>
          <Select defaultValue="7">
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-3 w-1/2 bg-muted rounded mb-2" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                </div>
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
            ))
          ) : (
            activities?.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.employee?.avatar} alt={activity.employee?.name} />
                  <AvatarFallback>
                    {activity.employee?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <a href={`/employee/${activity.employeeId}`} className="hover:underline">
                      {activity.employee?.name}
                    </a>{' '}
                    {activity.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.employee?.position}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
                <StatusBadge 
                  status={getActivityBadgeType(activity.activityType)} 
                  className="whitespace-nowrap"
                >
                  {getActivityBadgeLabel(activity.activityType)}
                </StatusBadge>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted pt-2 pb-2">
        <a href="/activities" className="text-sm font-medium text-primary hover:text-primary/80">
          View all activity
        </a>
      </CardFooter>
    </Card>
  );
}
