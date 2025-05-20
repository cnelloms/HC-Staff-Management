import { useState } from "react";
import Layout from "@/components/layout";
import { StaffTable } from "@/components/staff/staff-table";
import { OrgChart } from "@/components/staff/org-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Users } from "lucide-react";

export default function Directory() {
  const [activeView, setActiveView] = useState("table"); // Default to table view

  return (
    <Layout title="Staff Directory">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Staff Directory</h2>
          <p className="text-muted-foreground mb-6">
            View employee profiles, department assignments, and organization structure.
          </p>
        </div>

        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                <span>Table View</span>
              </TabsTrigger>
              <TabsTrigger value="org" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Organization Chart</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="table" className="space-y-4">
            <StaffTable />
          </TabsContent>

          <TabsContent value="org" className="space-y-4">
            <OrgChart />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
