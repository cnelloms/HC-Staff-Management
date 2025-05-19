import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FileTextIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemAccessStat } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export function SystemAccessTable() {
  const { data: accessStats, isLoading } = useQuery<SystemAccessStat[]>({
    queryKey: ['/api/dashboard/access-stats'],
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">System Access Overview</CardTitle>
          <Button variant="outline" size="sm">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-[300px]">System Name</TableHead>
                <TableHead>Total Users</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Pending Requests</TableHead>
                <TableHead className="w-[180px]">Access Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-muted mr-4"></div>
                        <div>
                          <div className="h-4 w-32 bg-muted rounded mb-1"></div>
                          <div className="h-3 w-24 bg-muted rounded"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-8 bg-muted rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-12 bg-muted rounded mb-1"></div>
                      <div className="h-3 w-8 bg-muted rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-8 bg-muted rounded"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-3 w-full bg-muted rounded mb-1"></div>
                      <div className="h-3 w-8 bg-muted rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                accessStats?.map((stat) => (
                  <TableRow key={stat.systemId}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md">
                          <FileTextIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {stat.systemName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {stat.systemDescription}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{stat.totalUsers}</TableCell>
                    <TableCell>
                      <div className="text-sm">{stat.activeUsers}</div>
                      <div className="text-sm text-muted-foreground">{stat.accessRate}%</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={stat.pendingRequests > 0 ? "pending" : "active"}
                      >
                        {stat.pendingRequests}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress value={stat.accessRate} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.accessRate}%</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="bg-muted pt-2 pb-2">
        <a href="/access-management" className="text-sm font-medium text-primary hover:text-primary/80">
          View detailed access report
        </a>
      </CardFooter>
    </Card>
  );
}
