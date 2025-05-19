import Layout from "@/components/layout";
import { StaffTable } from "@/components/staff/staff-table";

export default function Directory() {
  return (
    <Layout title="Staff Directory">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Staff Directory</h2>
          <p className="text-muted-foreground mb-6">
            Manage employee profiles, view department assignments, and track system access.
          </p>
        </div>

        <StaffTable />
      </div>
    </Layout>
  );
}
