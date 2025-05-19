import Layout from "@/components/layout";
import { AccessTable } from "@/components/access/access-table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart, PieChart } from "lucide-react";
import { SystemAccessStat } from "@/types";

export default function AccessManagement() {
  const { data: accessStats } = useQuery<SystemAccessStat[]>({
    queryKey: ['/api/dashboard/access-stats'],
  });

  // Calculate total stats
  const totalActive = accessStats?.reduce((sum, stat) => sum + stat.activeUsers, 0) || 0;
  const totalUsers = accessStats?.reduce((sum, stat) => sum + stat.totalUsers, 0) || 0;
  const overallAccessRate = totalUsers > 0 ? Math.round((totalActive / totalUsers) * 100) : 0;
  const totalPending = accessStats?.reduce((sum, stat) => sum + stat.pendingRequests, 0) || 0;

  return (
    <Layout title="Access Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">System Access Management</h2>
            <p className="text-muted-foreground">
              Manage and monitor system access permissions across the organization.
            </p>
          </div>
          <Button asChild>
            <Link href="/access-management/new">
              <a>Request New Access</a>
            </Link>
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Access Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-md bg-primary/10 p-2">
                  <BarChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{overallAccessRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {totalActive} active users out of {totalUsers} total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-md bg-yellow-100 p-2">
                  <PieChart className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalPending}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting approval
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Systems Managed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-md bg-secondary/10 p-2">
                  <BarChart className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{accessStats?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active systems in platform
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AccessTable />
      </div>
    </Layout>
  );
}
