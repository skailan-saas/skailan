
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Package } from "lucide-react";

export default function CrmProductsPage() {
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Package className="mr-3 h-8 w-8 text-primary"/>Products & Services</h1>
          <p className="text-muted-foreground">
            Manage your product and service catalog.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product/Service
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Product & Service List</CardTitle>
          <CardDescription>
            A table displaying all products and services will be shown here, with options to edit, view details, and manage inventory/availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">
            Product and service management table will be implemented here.
          </p>
          {/* Placeholder for table or list of products/services */}
        </CardContent>
      </Card>
    </div>
  );
}
