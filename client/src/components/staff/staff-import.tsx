import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Upload, FileText, AlertCircle, Info, Check } from "lucide-react";

// Define the schema for CSV upload and mapping
const csvImportSchema = z.object({
  csvData: z.string().min(1, { message: "CSV data is required" }),
  firstRowHeaders: z.boolean().default(true),
  delimiter: z.string().default(","),
  mappings: z.record(z.string(), z.string()).optional(),
});

// Required fields for employee import
const requiredFields = [
  "firstName",
  "lastName",
  "email",
  "position",
  "departmentId",
];

export function StaffImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappingComplete, setMappingComplete] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importStats, setImportStats] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
  });

  const form = useForm<z.infer<typeof csvImportSchema>>({
    resolver: zodResolver(csvImportSchema),
    defaultValues: {
      csvData: "",
      firstRowHeaders: true,
      delimiter: ",",
      mappings: {},
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/employees/import", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setImportStats({
        total: data.total,
        successful: data.successful,
        failed: data.failed,
        errors: data.errors || [],
      });
      toast({
        title: "Import complete",
        description: `Successfully imported ${data.successful} of ${data.total} employees.`,
      });
      form.reset();
      setPreviewData([]);
      setHeaders([]);
      setMappingComplete(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    },
  });

  const parseCSV = (csvText: string, delimiter: string, hasHeaders: boolean): { headers: string[], data: any[] } => {
    const lines = csvText.split(/\\r?\\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return { headers: [], data: [] };
    }

    const parsedHeaders = hasHeaders 
      ? lines[0].split(delimiter).map(h => h.trim()) 
      : lines[0].split(delimiter).map((_, i) => `Column ${i + 1}`);
    
    const startRow = hasHeaders ? 1 : 0;
    const parsedData = [];

    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(delimiter);
      
      if (values.length === parsedHeaders.length) {
        const row: Record<string, string> = {};
        parsedHeaders.forEach((header, index) => {
          row[header] = values[index].trim();
        });
        parsedData.push(row);
      }
    }

    return {
      headers: parsedHeaders,
      data: parsedData
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setValue("csvData", content);
      
      // Parse and preview the CSV data
      const delimiter = form.getValues("delimiter");
      const hasHeaders = form.getValues("firstRowHeaders");
      const { headers, data } = parseCSV(content, delimiter, hasHeaders);
      
      setHeaders(headers);
      setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
      
      // Initialize mappings
      const initialMappings: Record<string, string> = {};
      headers.forEach(header => {
        // Try to match CSV headers with expected field names
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (normalizedHeader.includes('first') && normalizedHeader.includes('name')) {
          initialMappings[header] = 'firstName';
        } else if (normalizedHeader.includes('last') && normalizedHeader.includes('name')) {
          initialMappings[header] = 'lastName';
        } else if (normalizedHeader.includes('email')) {
          initialMappings[header] = 'email';
        } else if (normalizedHeader.includes('position') || normalizedHeader.includes('title') || normalizedHeader.includes('job')) {
          initialMappings[header] = 'position';
        } else if (normalizedHeader.includes('department')) {
          initialMappings[header] = 'departmentId';
        } else if (normalizedHeader.includes('phone')) {
          initialMappings[header] = 'phone';
        } else if (normalizedHeader.includes('hire') && normalizedHeader.includes('date')) {
          initialMappings[header] = 'hireDate';
        } else if (normalizedHeader.includes('manager')) {
          initialMappings[header] = 'managerId';
        }
      });
      
      form.setValue("mappings", initialMappings);
    };
    
    reader.readAsText(file);
  };

  const handleDelimiterChange = () => {
    const csvData = form.getValues("csvData");
    if (!csvData) return;
    
    const delimiter = form.getValues("delimiter");
    const hasHeaders = form.getValues("firstRowHeaders");
    const { headers, data } = parseCSV(csvData, delimiter, hasHeaders);
    
    setHeaders(headers);
    setPreviewData(data.slice(0, 5));
    
    // Reset mappings when delimiter changes
    form.setValue("mappings", {});
  };

  const updateMapping = (csvHeader: string, fieldName: string) => {
    const currentMappings = form.getValues("mappings") || {};
    const newMappings = { ...currentMappings, [csvHeader]: fieldName };
    form.setValue("mappings", newMappings);
    
    // Check if all required fields are mapped
    const mappedFields = Object.values(newMappings);
    const allRequiredMapped = requiredFields.every(field => 
      mappedFields.includes(field)
    );
    
    setMappingComplete(allRequiredMapped);
  };

  const handleImport = () => {
    if (!mappingComplete) {
      toast({
        title: "Mapping incomplete",
        description: "Please map all required fields before importing",
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmImport = () => {
    setShowConfirmDialog(false);
    
    const csvData = form.getValues("csvData");
    const delimiter = form.getValues("delimiter");
    const hasHeaders = form.getValues("firstRowHeaders");
    const mappings = form.getValues("mappings") || {};
    
    const { data } = parseCSV(csvData, delimiter, hasHeaders);
    
    // Transform the data based on the field mappings
    const transformedData = data.map(row => {
      const transformedRow: Record<string, any> = {};
      
      Object.entries(mappings).forEach(([csvHeader, fieldName]) => {
        if (fieldName) {
          // Special handling for departmentId and managerId (convert to number)
          if (fieldName === 'departmentId' || fieldName === 'managerId') {
            transformedRow[fieldName] = parseInt(row[csvHeader]) || null;
          } else {
            transformedRow[fieldName] = row[csvHeader];
          }
        }
      });
      
      // Set default values
      if (!transformedRow.status) {
        transformedRow.status = 'active';
      }
      
      return transformedRow;
    });
    
    importMutation.mutate({ employees: transformedData });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Staff from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file containing employee information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="csvData"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Upload CSV File</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="file" 
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="w-full"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Upload a CSV file with employee data. The first row should contain column headers.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select a CSV file to import staff records
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="delimiter"
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-1/4">
                      <FormLabel>Delimiter</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleDelimiterChange();
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delimiter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=",">Comma (,)</SelectItem>
                          <SelectItem value=";">Semicolon (;)</SelectItem>
                          <SelectItem value="\t">Tab</SelectItem>
                          <SelectItem value="|">Pipe (|)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Character used to separate columns
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstRowHeaders"
                  render={({ field }) => (
                    <FormItem className="flex items-end space-x-2">
                      <FormControl>
                        <div className="flex items-center space-x-2 h-10">
                          <input
                            type="checkbox"
                            id="firstRowHeaders"
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              handleDelimiterChange();
                            }}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <label htmlFor="firstRowHeaders" className="text-sm font-medium">
                            First row contains headers
                          </label>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview Data */}
              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Data Preview</h3>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>Showing first {previewData.length} rows</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header, index) => (
                            <TableHead key={index}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {headers.map((header, colIndex) => (
                              <TableCell key={`${rowIndex}-${colIndex}`}>
                                {row[header]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Field Mapping */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Map CSV Columns to Fields</h3>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">
                          Required fields are marked with *
                        </span>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {headers.map((header, index) => {
                          const mappings = form.getValues("mappings") || {};
                          const selectedValue = mappings[header] || "";
                          
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-1/2 truncate font-medium">
                                {header}
                              </div>
                              <div className="w-1/2">
                                <Select 
                                  value={selectedValue} 
                                  onValueChange={(value) => updateMapping(header, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">-- Ignore this column --</SelectItem>
                                    <SelectItem value="firstName">First Name *</SelectItem>
                                    <SelectItem value="lastName">Last Name *</SelectItem>
                                    <SelectItem value="email">Email *</SelectItem>
                                    <SelectItem value="position">Position *</SelectItem>
                                    <SelectItem value="departmentId">Department ID *</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="hireDate">Hire Date</SelectItem>
                                    <SelectItem value="managerId">Manager ID</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Required fields status */}
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Required Fields Status</h4>
                        <div className="space-y-2">
                          {requiredFields.map(field => {
                            const mappings = form.getValues("mappings") || {};
                            const isMapped = Object.values(mappings).includes(field);
                            
                            return (
                              <div key={field} className="flex items-center gap-2">
                                {isMapped ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className={isMapped ? "text-green-700" : "text-red-700"}>
                                  {field.charAt(0).toUpperCase() + field.slice(1)} is {isMapped ? "mapped" : "not mapped"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              form.reset();
              setPreviewData([]);
              setHeaders([]);
              setMappingComplete(false);
            }}
          >
            Reset
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!mappingComplete || previewData.length === 0 || importMutation.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Staff
          </Button>
        </CardFooter>
      </Card>

      {/* Import Results */}
      {importStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              Summary of the staff import operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{importStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Processed</div>
                </div>
                <div className="p-4 bg-green-100 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{importStats.successful}</div>
                  <div className="text-sm text-green-700">Successfully Imported</div>
                </div>
                <div className="p-4 bg-red-100 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-700">{importStats.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {importStats.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Errors</h3>
                  <div className="border rounded-md p-4 bg-red-50 text-red-800 max-h-40 overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1">
                      {importStats.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import {previewData.length > 5 ? 'all' : previewData.length} staff records. 
              This action cannot be undone. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              Proceed with Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}