
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, ClipboardCheck } from "lucide-react";

export default function CrmTasksPage() {
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><ClipboardCheck className="mr-3 h-8 w-8 text-primary"/>Tasks Management</h1>
          <p className="text-muted-foreground">
            Organize and track your team's tasks.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            A table or board displaying tasks, their statuses, assignees, due dates, and related entities (leads/projects) will be shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">
            Task management interface (table or Kanban board) will be implemented here.
          </p>
          {/* Placeholder for table or list of tasks */}
        </CardContent>
      </Card>
    </div>
  );
}
