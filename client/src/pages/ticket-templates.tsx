import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Save } from "lucide-react";

/**
 * Template Management Page for Admin Users
 * Allows editing and customizing templates for different ticket types
 */
export default function TicketTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("staff-request");
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Fetch all ticket templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/ticket-templates'],
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/ticket-templates/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates'] });
      toast({
        title: "Template updated",
        description: "The ticket template has been successfully updated.",
      });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Start editing a template
  const handleEditTemplate = (template: any) => {
    setEditingTemplate({ ...template });
  };

  // Save template changes
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    updateMutation.mutate(editingTemplate);
  };

  // Cancel editing and discard changes
  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  // Update a field in the editing template
  const updateTemplateField = (field: string, value: any) => {
    if (!editingTemplate) return;
    
    setEditingTemplate((prev: any) => {
      // For nested fields in template.config
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          config: {
            ...prev.config,
            [parent]: {
              ...prev.config[parent],
              [child]: value
            }
          }
        };
      }
      
      // For direct fields
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Handle updates to checklist items
  const updateChecklistItem = (index: number, field: string, value: any) => {
    if (!editingTemplate || !editingTemplate.config || !editingTemplate.config.checklist) return;
    
    setEditingTemplate((prev: any) => {
      const newChecklist = [...prev.config.checklist];
      newChecklist[index] = {
        ...newChecklist[index],
        [field]: value
      };
      
      return {
        ...prev,
        config: {
          ...prev.config,
          checklist: newChecklist
        }
      };
    });
  };

  // Add a new checklist item
  const addChecklistItem = () => {
    if (!editingTemplate || !editingTemplate.config) return;
    
    setEditingTemplate((prev: any) => {
      const newChecklist = prev.config.checklist ? [...prev.config.checklist] : [];
      newChecklist.push({
        task: "New task",
        description: "Task description",
        required: true,
        category: "general"
      });
      
      return {
        ...prev,
        config: {
          ...prev.config,
          checklist: newChecklist
        }
      };
    });
  };

  // Remove a checklist item
  const removeChecklistItem = (index: number) => {
    if (!editingTemplate || !editingTemplate.config || !editingTemplate.config.checklist) return;
    
    setEditingTemplate((prev: any) => {
      const newChecklist = [...prev.config.checklist];
      newChecklist.splice(index, 1);
      
      return {
        ...prev,
        config: {
          ...prev.config,
          checklist: newChecklist
        }
      };
    });
  };

  // Filter templates by type for each tab
  const staffRequestTemplates = templates?.filter((t: any) => t.type === 'new_staff_request') || [];
  const itSupportTemplates = templates?.filter((t: any) => t.type === 'it_support') || [];

  // Loading state
  if (isLoading) {
    return (
      <Layout title="Ticket Templates">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading templates...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Ticket Templates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ticket Templates</h1>
          <Button variant="outline" asChild>
            <a href="/settings">Back to Settings</a>
          </Button>
        </div>

        <p className="text-muted-foreground">
          Customize templates for different ticket types. These templates determine the fields, checklists, 
          and default values used when creating new tickets.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="staff-request">New Staff Request</TabsTrigger>
            <TabsTrigger value="it-support">IT Support</TabsTrigger>
          </TabsList>

          {/* New Staff Request Templates */}
          <TabsContent value="staff-request" className="space-y-6">
            {staffRequestTemplates.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <p>No templates found for New Staff Request</p>
              </div>
            ) : (
              staffRequestTemplates.map((template: any) => (
                <Card key={template.id} className={editingTemplate?.id === template.id ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description || "No description available"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingTemplate?.id === template.id ? (
                      <StaffRequestTemplateEditor 
                        template={editingTemplate} 
                        updateField={updateTemplateField}
                        updateChecklistItem={updateChecklistItem}
                        addChecklistItem={addChecklistItem}
                        removeChecklistItem={removeChecklistItem}
                      />
                    ) : (
                      <TemplatePreview template={template} type="new_staff_request" />
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    {editingTemplate?.id === template.id ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveTemplate}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => handleEditTemplate(template)}>
                        Edit Template
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>

          {/* IT Support Templates */}
          <TabsContent value="it-support" className="space-y-6">
            {itSupportTemplates.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <p>No templates found for IT Support</p>
              </div>
            ) : (
              itSupportTemplates.map((template: any) => (
                <Card key={template.id} className={editingTemplate?.id === template.id ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description || "No description available"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingTemplate?.id === template.id ? (
                      <ITSupportTemplateEditor 
                        template={editingTemplate} 
                        updateField={updateTemplateField}
                        updateChecklistItem={updateChecklistItem}
                        addChecklistItem={addChecklistItem}
                        removeChecklistItem={removeChecklistItem}
                      />
                    ) : (
                      <TemplatePreview template={template} type="it_support" />
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    {editingTemplate?.id === template.id ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveTemplate}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => handleEditTemplate(template)}>
                        Edit Template
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Editor component for Staff Request templates
function StaffRequestTemplateEditor({ 
  template, 
  updateField, 
  updateChecklistItem,
  addChecklistItem,
  removeChecklistItem
}: {
  template: any;
  updateField: (field: string, value: any) => void;
  updateChecklistItem: (index: number, field: string, value: any) => void;
  addChecklistItem: () => void;
  removeChecklistItem: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="template-name">Template Name</Label>
          <Input 
            id="template-name" 
            value={template.name || ''} 
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="template-description">Description</Label>
          <Textarea 
            id="template-description" 
            value={template.description || ''} 
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Required Fields</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-firstName" 
              checked={template?.config?.requiredFields?.includes('firstName')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'firstName']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'firstName'));
                }
              }}
            />
            <Label htmlFor="field-firstName">First Name</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-lastName" 
              checked={template?.config?.requiredFields?.includes('lastName')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'lastName']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'lastName'));
                }
              }}
            />
            <Label htmlFor="field-lastName">Last Name</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-email" 
              checked={template?.config?.requiredFields?.includes('email')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'email']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'email'));
                }
              }}
            />
            <Label htmlFor="field-email">Email</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-phone" 
              checked={template?.config?.requiredFields?.includes('phone')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'phone']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'phone'));
                }
              }}
            />
            <Label htmlFor="field-phone">Phone</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-position" 
              checked={template?.config?.requiredFields?.includes('positionId')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'positionId']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'positionId'));
                }
              }}
            />
            <Label htmlFor="field-position">Position</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-department" 
              checked={template?.config?.requiredFields?.includes('departmentId')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'departmentId']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'departmentId'));
                }
              }}
            />
            <Label htmlFor="field-department">Department</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-manager" 
              checked={template?.config?.requiredFields?.includes('reportingManagerId')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'reportingManagerId']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'reportingManagerId'));
                }
              }}
            />
            <Label htmlFor="field-manager">Reporting Manager</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-startDate" 
              checked={template?.config?.requiredFields?.includes('startDate')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'startDate']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'startDate'));
                }
              }}
            />
            <Label htmlFor="field-startDate">Start Date</Label>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Default Checklist Items</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addChecklistItem}
          >
            Add Item
          </Button>
        </div>
        
        {template?.config?.checklist && template.config.checklist.length > 0 ? (
          template.config.checklist.map((item: any, index: number) => (
            <div key={index} className="space-y-2 p-4 border rounded-md">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Task {index + 1}</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeChecklistItem(index)}
                  className="text-destructive h-8 px-2"
                >
                  Remove
                </Button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`task-${index}`}>Task Name</Label>
                  <Input 
                    id={`task-${index}`} 
                    value={item.task || ''} 
                    onChange={(e) => updateChecklistItem(index, 'task', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea 
                    id={`description-${index}`} 
                    value={item.description || ''} 
                    onChange={(e) => updateChecklistItem(index, 'description', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`required-${index}`} 
                      checked={item.required} 
                      onChange={(e) => updateChecklistItem(index, 'required', e.target.checked)}
                    />
                    <Label htmlFor={`required-${index}`}>Required</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor={`category-${index}`} className="mr-2">Category:</Label>
                    <select 
                      id={`category-${index}`}
                      value={item.category || 'general'}
                      onChange={(e) => updateChecklistItem(index, 'category', e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="general">General</option>
                      <option value="accounts">Accounts</option>
                      <option value="equipment">Equipment</option>
                      <option value="access">Access</option>
                      <option value="training">Training</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4 border rounded">
            <p className="text-sm text-muted-foreground">No checklist items defined</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addChecklistItem}
              className="mt-2"
            >
              Add Your First Item
            </Button>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Title Template</h3>
        <Input 
          value={template?.config?.titleTemplate || 'New Staff Request: {{firstName}} {{lastName}} ({{position}})'}
          onChange={(e) => updateField('config.titleTemplate', e.target.value)}
          placeholder="Enter title template with {{placeholders}}"
        />
        <p className="text-sm text-muted-foreground">
          Use {{firstName}}, {{lastName}}, {{position}}, {{department}} as placeholders
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Description Template</h3>
        <Textarea 
          value={template?.config?.descriptionTemplate || ''}
          onChange={(e) => updateField('config.descriptionTemplate', e.target.value)}
          placeholder="Enter description template with {{placeholders}}"
          className="min-h-[200px]"
        />
        <p className="text-sm text-muted-foreground">
          Available placeholders: {{firstName}}, {{lastName}}, {{position}}, {{department}}, 
          {{manager}}, {{startDate}}, {{email}}, {{phone}}
        </p>
      </div>
    </div>
  );
}

// Editor component for IT Support templates
function ITSupportTemplateEditor({ 
  template, 
  updateField, 
  updateChecklistItem,
  addChecklistItem,
  removeChecklistItem
}: {
  template: any;
  updateField: (field: string, value: any) => void;
  updateChecklistItem: (index: number, field: string, value: any) => void;
  addChecklistItem: () => void;
  removeChecklistItem: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="template-name">Template Name</Label>
          <Input 
            id="template-name" 
            value={template.name || ''} 
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="template-description">Description</Label>
          <Textarea 
            id="template-description" 
            value={template.description || ''} 
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Required Fields</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-issueCategory" 
              checked={template?.config?.requiredFields?.includes('issueCategory')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'issueCategory']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'issueCategory'));
                }
              }}
            />
            <Label htmlFor="field-issueCategory">Issue Category</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-deviceType" 
              checked={template?.config?.requiredFields?.includes('deviceType')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'deviceType']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'deviceType'));
                }
              }}
            />
            <Label htmlFor="field-deviceType">Device Type</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-urgency" 
              checked={template?.config?.requiredFields?.includes('urgency')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'urgency']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'urgency'));
                }
              }}
            />
            <Label htmlFor="field-urgency">Urgency</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-issueDetails" 
              checked={template?.config?.requiredFields?.includes('issueDetails')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'issueDetails']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'issueDetails'));
                }
              }}
            />
            <Label htmlFor="field-issueDetails">Issue Details</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-reproducibility" 
              checked={template?.config?.requiredFields?.includes('reproducibility')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'reproducibility']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'reproducibility'));
                }
              }}
            />
            <Label htmlFor="field-reproducibility">Reproducibility</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="field-stepsTaken" 
              checked={template?.config?.requiredFields?.includes('stepsTaken')} 
              onChange={(e) => {
                const requiredFields = template?.config?.requiredFields || [];
                if (e.target.checked) {
                  updateField('config.requiredFields', [...requiredFields, 'stepsTaken']);
                } else {
                  updateField('config.requiredFields', requiredFields.filter((f: string) => f !== 'stepsTaken'));
                }
              }}
            />
            <Label htmlFor="field-stepsTaken">Steps Already Taken</Label>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Default Checklist Items</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addChecklistItem}
          >
            Add Item
          </Button>
        </div>
        
        {template?.config?.checklist && template.config.checklist.length > 0 ? (
          template.config.checklist.map((item: any, index: number) => (
            <div key={index} className="space-y-2 p-4 border rounded-md">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Task {index + 1}</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeChecklistItem(index)}
                  className="text-destructive h-8 px-2"
                >
                  Remove
                </Button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`task-${index}`}>Task Name</Label>
                  <Input 
                    id={`task-${index}`} 
                    value={item.task || ''} 
                    onChange={(e) => updateChecklistItem(index, 'task', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea 
                    id={`description-${index}`} 
                    value={item.description || ''} 
                    onChange={(e) => updateChecklistItem(index, 'description', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`required-${index}`} 
                      checked={item.required} 
                      onChange={(e) => updateChecklistItem(index, 'required', e.target.checked)}
                    />
                    <Label htmlFor={`required-${index}`}>Required</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor={`category-${index}`} className="mr-2">Category:</Label>
                    <select 
                      id={`category-${index}`}
                      value={item.category || 'support'}
                      onChange={(e) => updateChecklistItem(index, 'category', e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="support">Support</option>
                      <option value="diagnostics">Diagnostics</option>
                      <option value="resolution">Resolution</option>
                      <option value="verification">Verification</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`phase-${index}`} className="mr-2">Phase:</Label>
                    <select 
                      id={`phase-${index}`}
                      value={item.phase || '1'}
                      onChange={(e) => updateChecklistItem(index, 'phase', e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="1">Phase 1: Diagnostics</option>
                      <option value="2">Phase 2: Solution</option>
                      <option value="3">Phase 3: Verification</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4 border rounded">
            <p className="text-sm text-muted-foreground">No checklist items defined</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addChecklistItem}
              className="mt-2"
            >
              Add Your First Item
            </Button>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Available Issue Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template?.config?.categories?.map((category: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Input 
                value={category} 
                onChange={(e) => {
                  if (!template?.config?.categories) return;
                  const newCategories = [...template.config.categories];
                  newCategories[index] = e.target.value;
                  updateField('config.categories', newCategories);
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (!template?.config?.categories) return;
                  const newCategories = [...template.config.categories];
                  newCategories.splice(index, 1);
                  updateField('config.categories', newCategories);
                }}
                className="text-destructive h-8 px-2"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const categories = template?.config?.categories || [];
              updateField('config.categories', [...categories, 'New Category']);
            }}
          >
            Add Category
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Available Device Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template?.config?.deviceTypes?.map((deviceType: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Input 
                value={deviceType} 
                onChange={(e) => {
                  if (!template?.config?.deviceTypes) return;
                  const newDeviceTypes = [...template.config.deviceTypes];
                  newDeviceTypes[index] = e.target.value;
                  updateField('config.deviceTypes', newDeviceTypes);
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (!template?.config?.deviceTypes) return;
                  const newDeviceTypes = [...template.config.deviceTypes];
                  newDeviceTypes.splice(index, 1);
                  updateField('config.deviceTypes', newDeviceTypes);
                }}
                className="text-destructive h-8 px-2"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const deviceTypes = template?.config?.deviceTypes || [];
              updateField('config.deviceTypes', [...deviceTypes, 'New Device Type']);
            }}
          >
            Add Device Type
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Title Template</h3>
        <Input 
          value={template?.config?.titleTemplate || 'IT Support: {{issueCategory}} issue with {{deviceType}}'}
          onChange={(e) => updateField('config.titleTemplate', e.target.value)}
          placeholder="Enter title template with {{placeholders}}"
        />
        <p className="text-sm text-muted-foreground">
          Use {{issueCategory}}, {{deviceType}}, {{urgency}} as placeholders
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Description Template</h3>
        <Textarea 
          value={template?.config?.descriptionTemplate || ''}
          onChange={(e) => updateField('config.descriptionTemplate', e.target.value)}
          placeholder="Enter description template with {{placeholders}}"
          className="min-h-[200px]"
        />
        <p className="text-sm text-muted-foreground">
          Available placeholders: {{issueCategory}}, {{deviceType}}, {{urgency}}, 
          {{issueDetails}}, {{reproducibility}}, {{stepsTaken}}
        </p>
      </div>
    </div>
  );
}

// Component to preview template configuration
function TemplatePreview({ template, type }: { template: any, type: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Required Fields</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {template?.config?.requiredFields?.map((field: string) => (
            <div key={field} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm flex items-center">
              <Check className="mr-1 h-3 w-3" />
              {field}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium">Checklist Items</h3>
        <div className="mt-2 space-y-2">
          {template?.config?.checklist?.map((item: any, index: number) => (
            <div key={index} className="p-2 border rounded-md">
              <div className="font-medium">{item.task}</div>
              {item.description && (
                <div className="text-sm text-muted-foreground">{item.description}</div>
              )}
              <div className="mt-1 flex gap-2 text-xs">
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                  {item.category}
                </span>
                {type === 'it_support' && item.phase && (
                  <span className="px-1.5 py-0.5 bg-secondary/80 rounded">
                    Phase {item.phase}
                  </span>
                )}
                {item.required && (
                  <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">
                    Required
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {(!template?.config?.checklist || template.config.checklist.length === 0) && (
          <div className="mt-2 text-sm text-muted-foreground">
            No checklist items defined
          </div>
        )}
      </div>
      
      {type === 'it_support' && (
        <>
          <div>
            <h3 className="font-medium">Issue Categories</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {template?.config?.categories?.map((category: string, index: number) => (
                <div key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                  {category}
                </div>
              ))}
            </div>
            {(!template?.config?.categories || template.config.categories.length === 0) && (
              <div className="mt-2 text-sm text-muted-foreground">
                No categories defined
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium">Device Types</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {template?.config?.deviceTypes?.map((deviceType: string, index: number) => (
                <div key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                  {deviceType}
                </div>
              ))}
            </div>
            {(!template?.config?.deviceTypes || template.config.deviceTypes.length === 0) && (
              <div className="mt-2 text-sm text-muted-foreground">
                No device types defined
              </div>
            )}
          </div>
        </>
      )}
      
      <div>
        <h3 className="font-medium">Title Template</h3>
        <div className="mt-1 text-sm border p-2 rounded-md">
          {template?.config?.titleTemplate || 
            (type === 'new_staff_request' 
              ? 'New Staff Request: {{firstName}} {{lastName}} ({{position}})'
              : 'IT Support: {{issueCategory}} issue with {{deviceType}}')
          }
        </div>
      </div>
      
      <div>
        <h3 className="font-medium">Description Template</h3>
        <div className="mt-1 text-sm border p-2 rounded-md whitespace-pre-wrap">
          {template?.config?.descriptionTemplate || 'No description template defined'}
        </div>
      </div>
    </div>
  );
}