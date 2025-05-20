import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";

export function ImportGuidelines() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import Guidelines</CardTitle>
        <CardDescription>
          Please follow these guidelines to ensure your data imports correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>File Format</AlertTitle>
          <AlertDescription>
            Your file must be in CSV format with the first row containing column headers.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Employee Import Format</h3>
          <p className="text-sm text-muted-foreground">
            Required columns for employee imports:
          </p>
          <ul className="list-disc list-inside text-sm">
            <li><span className="font-medium">first_name</span> - Employee's first name</li>
            <li><span className="font-medium">last_name</span> - Employee's last name</li>
            <li><span className="font-medium">email</span> - Employee's email address</li>
            <li><span className="font-medium">department</span> - Department name (must exist in the system)</li>
            <li><span className="font-medium">position</span> - Job title</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Optional columns:
          </p>
          <ul className="list-disc list-inside text-sm">
            <li><span className="font-medium">phone</span> - Employee's phone number</li>
            <li><span className="font-medium">hire_date</span> - Format: YYYY-MM-DD</li>
            <li><span className="font-medium">manager_email</span> - Email of the employee's manager (must exist in the system)</li>
            <li><span className="font-medium">status</span> - Employment status (active, inactive, on_leave)</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Department Import Format</h3>
          <p className="text-sm text-muted-foreground">
            Required columns for department imports:
          </p>
          <ul className="list-disc list-inside text-sm">
            <li><span className="font-medium">name</span> - Department name</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Optional columns:
          </p>
          <ul className="list-disc list-inside text-sm">
            <li><span className="font-medium">description</span> - Department description</li>
            <li><span className="font-medium">head_email</span> - Email of the department head (must exist in the system)</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">System Access Import Format</h3>
          <p className="text-sm text-muted-foreground">
            Required columns for system access imports:
          </p>
          <ul className="list-disc list-inside text-sm">
            <li><span className="font-medium">email</span> - Employee's email address (must exist in the system)</li>
            <li><span className="font-medium">system_name</span> - Name of the system (must exist in the system)</li>
            <li><span className="font-medium">access_level</span> - Level of access (read, write, admin)</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Optional columns:
          </p>
          <ul className="list-disc list-inside text-sm">
            <li><span className="font-medium">request_reason</span> - Reason for system access</li>
            <li><span className="font-medium">start_date</span> - Format: YYYY-MM-DD</li>
            <li><span className="font-medium">end_date</span> - Format: YYYY-MM-DD (for temporary access)</li>
          </ul>
        </div>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Notes</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm mt-2">
              <li>All emails must be unique and valid format</li>
              <li>Dates must be in YYYY-MM-DD format</li>
              <li>Department names must match exactly if referring to existing departments</li>
              <li>Any referenced managers or department heads must exist in the system</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert variant="default">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Sample CSV Templates</AlertTitle>
          <AlertDescription>
            <p className="text-sm mt-1">
              Download our sample templates to get started:
            </p>
            <div className="flex gap-2 mt-2">
              <a 
                href="/templates/employee_import_template.csv" 
                className="text-sm text-blue-600 hover:underline"
                download
              >
                Employee Template
              </a>
              <a 
                href="/templates/department_import_template.csv" 
                className="text-sm text-blue-600 hover:underline"
                download
              >
                Department Template
              </a>
              <a 
                href="/templates/system_access_template.csv" 
                className="text-sm text-blue-600 hover:underline"
                download
              >
                System Access Template
              </a>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}