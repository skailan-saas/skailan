
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";

export default function CrmLeadsPage() {
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3 h-8 w-8 text-primary"/>Leads Management</h1>
          <p className="text-muted-foreground">
            View, track, and manage all your customer leads. This is the main Leads page.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Leads List</CardTitle>
          <CardDescription>
            A comprehensive table displaying all leads will be shown here. 
            Functionality to filter, sort, view lead details, and perform actions will be implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Lead Data Coming Soon</h3>
            <p className="text-muted-foreground">
              The lead management table and associated tools are under construction.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
