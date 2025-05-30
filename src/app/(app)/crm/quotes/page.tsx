
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, FileText } from "lucide-react";

export default function CrmQuotesPage() {
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><FileText className="mr-3 h-8 w-8 text-primary"/>Quotes Management</h1>
          <p className="text-muted-foreground">
            Create, send, and track your sales quotes.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Quote
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quotes List</CardTitle>
          <CardDescription>
            A table displaying all quotes, their statuses, associated leads, and totals will be shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">
            Quote management table and tools will be implemented here.
          </p>
          {/* Placeholder for table or list of quotes */}
        </CardContent>
      </Card>
    </div>
  );
}

