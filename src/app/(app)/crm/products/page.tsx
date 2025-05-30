
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Package, Search, Filter, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Based on Prisma ProductType enum
type ProductType = "PRODUCT" | "SERVICE";

interface Product {
  id: string;
  name: string;
  type: ProductType;
  description?: string;
  price: number;
  sku?: string; // Stock Keeping Unit, for products
  category?: string;
  isActive: boolean;
}

const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Premium Website Development",
    type: "SERVICE",
    description: "Full-stack website development including design, development, and deployment.",
    price: 5000,
    category: "Web Services",
    isActive: true,
  },
  {
    id: "prod-2",
    name: "Wireless Noise-Cancelling Headphones",
    type: "PRODUCT",
    description: "High-fidelity sound with active noise cancellation and 20-hour battery life.",
    price: 199.99,
    sku: "HDPHN-NC20-BLK",
    category: "Electronics",
    isActive: true,
  },
  {
    id: "prod-3",
    name: "Monthly SEO Optimization Plan",
    type: "SERVICE",
    description: "Ongoing SEO services to improve search engine rankings and organic traffic.",
    price: 750,
    category: "Marketing Services",
    isActive: true,
  },
  {
    id: "prod-4",
    name: "Ergonomic Office Chair",
    type: "PRODUCT",
    description: "Comfortable and adjustable chair for long working hours.",
    price: 349.50,
    sku: "CHR-ERG-001-GRY",
    category: "Office Furniture",
    isActive: false,
  },
  {
    id: "prod-5",
    name: "Chatbot Integration Service",
    type: "SERVICE",
    description: "Integrate an AI-powered chatbot into your website or platform.",
    price: 1200,
    category: "AI Solutions",
    isActive: true,
  },
];

export default function CrmProductsPage() {
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
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

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-lg">Product & Service List</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-xs">{product.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.type === 'PRODUCT' ? "secondary" : "outline"}>
                        {product.type === 'PRODUCT' ? 'Product' : 'Service'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.category || "N/A"}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={product.isActive ? "default" : "destructive"} className={product.isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {initialProducts.length === 0 && (
                <div className="text-center py-20">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Products or Services Found</h3>
                    <p className="text-muted-foreground">
                    Add your first product or service to get started.
                    </p>
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
        <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Pagination and advanced filtering controls will be added here.
      </div>
    </div>
  );
}

    