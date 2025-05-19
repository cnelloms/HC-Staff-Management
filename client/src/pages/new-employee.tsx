import Layout from "@/components/layout";
import { StaffForm } from "@/components/staff/staff-form";

export default function NewEmployee() {
  return (
    <Layout title="Add New Employee">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Add New Employee</h2>
        <StaffForm />
      </div>
    </Layout>
  );
}
