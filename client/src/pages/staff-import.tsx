import Layout from "@/components/layout";
import { StaffImport } from "@/components/staff/staff-import";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle } from "lucide-react";

export default function StaffImportPage() {
  return (
    <Layout title="Staff Import">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Staff Import</h2>
          <p className="text-muted-foreground">
            Import staff data from CSV files to quickly add multiple employees to the system.
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList>
            <TabsTrigger value="import">Import Staff</TabsTrigger>
            <TabsTrigger value="guidelines">Import Guidelines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4">
            <StaffImport />
          </TabsContent>
          
          <TabsContent value="guidelines" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  CSV Import Guidelines
                </CardTitle>
                <CardDescription>
                  Follow these guidelines to ensure a successful import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">File Format</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use CSV (Comma-Separated Values) format</li>
                    <li>Ensure the first row contains column headers</li>
                    <li>Make sure there are no extra commas, quotes, or special characters in the data</li>
                    <li>UTF-8 encoding is recommended</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Required Fields</h3>
                  <div className="bg-muted p-4 rounded-md mb-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <p className="text-sm">
                        The following fields are <span className="font-bold">required</span> for each employee record. Make sure your CSV file includes columns that can be mapped to these fields.
                      </p>
                    </div>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="font-medium">First Name</span> - Employee's first name</li>
                    <li><span className="font-medium">Last Name</span> - Employee's last name</li>
                    <li><span className="font-medium">Email</span> - Valid email address (must be unique)</li>
                    <li><span className="font-medium">Position</span> - Job title or position</li>
                    <li><span className="font-medium">Department ID</span> - Numeric ID of the department</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Optional Fields</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="font-medium">Phone</span> - Contact phone number</li>
                    <li><span className="font-medium">Hire Date</span> - Date of hire (YYYY-MM-DD format)</li>
                    <li><span className="font-medium">Manager ID</span> - Numeric ID of the employee's manager</li>
                    <li><span className="font-medium">Status</span> - Employee status (active, inactive, onboarding)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Department IDs</h3>
                  <p className="mb-2">
                    Use the following department IDs in your import file:
                  </p>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department Name</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">1</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Human Resources</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">2</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">IT</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">3</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Finance</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">4</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Operations</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">5</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Clinical</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Example CSV</h3>
                  <div className="bg-muted p-4 rounded-md overflow-x-auto">
                    <pre className="text-xs">
                      firstName,lastName,email,position,departmentId,phone,hireDate,managerId,status<br/>
                      John,Doe,john.doe@healthcare.com,Nurse,5,555-123-4567,2023-01-15,3,active<br/>
                      Jane,Smith,jane.smith@healthcare.com,IT Specialist,2,555-987-6543,2023-02-20,1,active<br/>
                      Michael,Johnson,michael.j@healthcare.com,HR Manager,1,555-567-8901,2022-11-10,,active
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}