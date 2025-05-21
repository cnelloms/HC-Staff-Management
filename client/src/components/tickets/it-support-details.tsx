import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Laptop, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";

interface ITSupportDetailsProps {
  ticketId: number;
  metadata: any;
}

export function ITSupportDetails({ ticketId, metadata }: ITSupportDetailsProps) {
  const { toast } = useToast();
  
  // Track completion status of the tasks
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      title: "Run initial diagnostics", 
      completed: metadata?.diagnosticsCompleted || false,
      icon: <Laptop className="h-5 w-5" />
    },
    { 
      id: 2, 
      title: "Implement solution", 
      completed: metadata?.solutionImplemented || false,
      icon: <CheckCircle className="h-5 w-5" />
    },
    { 
      id: 3, 
      title: "Verify issue is resolved", 
      completed: metadata?.verificationCompleted || false,
      icon: <CheckCircle className="h-5 w-5" />
    }
  ]);
  
  // Track completion progress
  const [progress, setProgress] = useState(0);
  
  // Track solution notes
  const [solutionNotes, setSolutionNotes] = useState(metadata?.solutionNotes || "");
  
  // Update progress when tasks change
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressValue = Math.round((completedTasks / tasks.length) * 100);
    setProgress(progressValue);
  }, [tasks]);
  
  // Update ticket metadata mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      // Create a clean copy of metadata with updates
      const updatedMetadata = {
        ...JSON.parse(JSON.stringify(metadata || {})),
        ...updatedData
      };
      
      // Create the payload
      const payload: any = {
        metadata: updatedMetadata
      };
      
      // If all tasks are completed, close the ticket
      if (updatedData.allTasksCompleted) {
        payload.status = "closed";
      }
      
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Update successful",
        description: "The IT support task has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle task completion toggle
  const toggleTaskCompletion = (taskId: number) => {
    // Get the current tasks
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      // Update the task completion status
      updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;
      setTasks(updatedTasks);
      
      // Create the update data based on which task was toggled
      let updateData: any = {};
      
      if (taskId === 1) {
        updateData.diagnosticsCompleted = updatedTasks[taskIndex].completed;
      } else if (taskId === 2) {
        updateData.solutionImplemented = updatedTasks[taskIndex].completed;
      } else if (taskId === 3) {
        updateData.verificationCompleted = updatedTasks[taskIndex].completed;
      }
      
      // Check if all tasks are completed
      const allCompleted = updatedTasks.every(task => task.completed);
      if (allCompleted) {
        updateData.allTasksCompleted = true;
      }
      
      // Update the ticket
      updateTicketMutation.mutate(updateData);
    }
  };
  
  // Handle saving solution notes
  const saveSolutionNotes = () => {
    updateTicketMutation.mutate({ 
      solutionNotes
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Laptop className="h-5 w-5" />
          IT Support Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Issue Category, Device Type, and Urgency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Issue Category</span>
            <p className="font-medium">{metadata?.issueCategory || "Not specified"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Device Type</span>
            <p className="font-medium">{metadata?.deviceType || "Not specified"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Urgency</span>
            <Badge variant={metadata?.urgency === "Critical" ? "destructive" : 
                          metadata?.urgency === "High" ? "default" : 
                          "secondary"}>
              {metadata?.urgency || "Not specified"}
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        {/* Issue Details and Steps to Reproduce */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Issue Details</span>
            <p className="whitespace-pre-line">{metadata?.issueDetails || "No details provided"}</p>
          </div>
          
          {metadata?.stepsToReproduce && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Steps to Reproduce</span>
              <p className="whitespace-pre-line">{metadata.stepsToReproduce}</p>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Solution Notes */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Solution Notes</span>
          <Textarea 
            placeholder="Document the solution implemented for this issue" 
            className="min-h-[100px]"
            value={solutionNotes}
            onChange={(e) => setSolutionNotes(e.target.value)}
          />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={saveSolutionNotes}
            disabled={updateTicketMutation.isPending}
          >
            {updateTicketMutation.isPending ? "Saving..." : "Save Notes"}
          </Button>
        </div>
        
        <Separator />
        
        {/* Task Completion Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Issue Resolution Progress</span>
            <span className="text-sm">{progress}% Complete</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="space-y-3 mt-4">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  {task.icon}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                </div>
                
                <Button 
                  variant={task.completed ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => toggleTaskCompletion(task.id)}
                >
                  {task.completed ? "Completed" : "Mark Complete"}
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Instructions and Notes */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-400">Important Note</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Please mark each task as complete after you've finished it. When all tasks are completed, the system will automatically close this ticket.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}