
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Package, Search, Filter, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_TYPES = ["PRODUCTO", "SERVICIO"] as const;
type ProductType = typeof PRODUCT_TYPES[number];

interface Product {
  id: string;
  name: string;
  type: ProductType;
  description?: string;
  price: number;
  sku?: string; 
  category?: string;
  isActive: boolean;
}

const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Premium Website Development",
    type: "SERVICIO",
    description: "Full-stack website development including design, development, and deployment.",
    price: 5000,
    category: "Web Services",
    isActive: true,
  },
  {
    id: "prod-2",
    name: "Wireless Noise-Cancelling Headphones",
    type: "PRODUCTO",
    description: "High-fidelity sound with active noise cancellation and 20-hour battery life.",
    price: 199.99,
    sku: "HDPHN-NC20-BLK",
    category: "Electronics",
    isActive: true,
  },
];

export default function CrmProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state for adding
  const [newProductName, setNewProductName] = useState("");
  const [newProductType, setNewProductType] = useState<ProductType>("PRODUCTO");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductPrice, setNewProductPrice] = useState<number | string>("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductIsActive, setNewProductIsActive] = useState(true);

  // Form state for editing
  const [editFormProductName, setEditFormProductName] = useState("");
  const [editFormProductType, setEditFormProductType] = useState<ProductType>("PRODUCTO");
  const [editFormProductDescription, setEditFormProductDescription] = useState("");
  const [editFormProductPrice, setEditFormProductPrice] = useState<number | string>("");
  const [editFormProductSku, setEditFormProductSku] = useState("");
  const [editFormProductCategory, setEditFormProductCategory] = useState("");
  const [editFormProductIsActive, setEditFormProductIsActive] = useState(true);

  const resetAddProductForm = () => {
    setNewProductName("");
    setNewProductType("PRODUCTO");
    setNewProductDescription("");
    setNewProductPrice("");
    setNewProductSku("");
    setNewProductCategory("");
    setNewProductIsActive(true);
  };

  const handleAddProductSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const priceAsNumber = parseFloat(String(newProductPrice));
    if (isNaN(priceAsNumber) || priceAsNumber < 0) {
        toast({ title: "Invalid Price", description: "Please enter a valid price.", variant: "destructive" });
        return;
    }
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName,
      type: newProductType,
      description: newProductDescription || undefined,
      price: priceAsNumber,
      sku: newProductType === "PRODUCTO" ? newProductSku || undefined : undefined,
      category: newProductCategory || undefined,
      isActive: newProductIsActive,
    };
    setProducts(prevProducts => [newProd, ...prevProducts]);
    toast({ title: "Product/Service Added", description: `${newProd.name} has been added.` });
    resetAddProductForm();
    setIsAddProductDialogOpen(false);
  };
  
  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product);
    setEditFormProductName(product.name);
    setEditFormProductType(product.type);
    setEditFormProductDescription(product.description || "");
    setEditFormProductPrice(product.price);
    setEditFormProductSku(product.sku || "");
    setEditFormProductCategory(product.category || "");
    setEditFormProductIsActive(product.isActive);
    setIsEditProductDialogOpen(true);
  };

  const handleEditProductSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const priceAsNumber = parseFloat(String(editFormProductPrice));
    if (isNaN(priceAsNumber) || priceAsNumber < 0) {
        toast({ title: "Invalid Price", description: "Please enter a valid price.", variant: "destructive" });
        return;
    }
    const updatedProduct: Product = {
      ...editingProduct,
      name: editFormProductName,
      type: editFormProductType,
      description: editFormProductDescription || undefined,
      price: priceAsNumber,
      sku: editFormProductType === "PRODUCTO" ? editFormProductSku || undefined : undefined,
      category: editFormProductCategory || undefined,
      isActive: editFormProductIsActive,
    };
    setProducts(prevProducts => prevProducts.map(p => p.id === editingProduct.id ? updatedProduct : p));
    toast({ title: "Product/Service Updated", description: `${updatedProduct.name} has been updated.` });
    setIsEditProductDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    toast({ title: "Product/Service Deleted (Demo)", description: "Item has been removed." });
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Package className="mr-3 h-8 w-8 text-primary"/>Products & Services</h1>
          <p className="text-muted-foreground">
            Manage your product and service catalog.
          </p>
        </div>
        <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product/Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Add New Product or Service</DialogTitle>
              <DialogDescription>Enter the details for the new item.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProductSubmit}>
              <ScrollArea className="max-h-[60vh] p-1">
                <div className="grid gap-4 py-4 pr-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductName" className="text-right col-span-1">Name</Label>
                    <Input id="newProductName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g., Premium Subscription" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductType" className="text-right col-span-1">Type</Label>
                    <Select value={newProductType} onValueChange={(value: ProductType) => setNewProductType(value)}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{PRODUCT_TYPES.map(type => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="newProductDescription" className="text-right col-span-1 pt-2">Description</Label>
                    <Textarea id="newProductDescription" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="Describe the item" className="col-span-3" rows={3}/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductPrice" className="text-right col-span-1">Price ($)</Label>
                    <Input id="newProductPrice" type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="e.g., 99.99" className="col-span-3" required step="0.01" min="0"/>
                  </div>
                  {newProductType === "PRODUCTO" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="newProductSku" className="text-right col-span-1">SKU</Label>
                      <Input id="newProductSku" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} placeholder="e.g., PROD-001" className="col-span-3" />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductCategory" className="text-right col-span-1">Category</Label>
                    <Input id="newProductCategory" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} placeholder="e.g., Software" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newProductIsActive" className="text-right col-span-1">Active</Label>
                    <Switch id="newProductIsActive" checked={newProductIsActive} onCheckedChange={setNewProductIsActive} className="col-span-3 justify-self-start"/>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetAddProductForm}>Cancel</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Product/Service</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit: {editingProduct?.name}</DialogTitle>
            <DialogDescription>Update the details for this product or service.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProductSubmit}>
            <ScrollArea className="max-h-[60vh] p-1">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editFormProductName" className="text-right col-span-1">Name</Label>
                  <Input id="editFormProductName" value={editFormProductName} onChange={(e) => setEditFormProductName(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editFormProductType" className="text-right col-span-1">Type</Label>
                  <Select value={editFormProductType} onValueChange={(value: ProductType) => setEditFormProductType(value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{PRODUCT_TYPES.map(type => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="editFormProductDescription" className="text-right col-span-1 pt-2">Description</Label>
                  <Textarea id="editFormProductDescription" value={editFormProductDescription} onChange={(e) => setEditFormProductDescription(e.target.value)} className="col-span-3" rows={3}/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editFormProductPrice" className="text-right col-span-1">Price ($)</Label>
                  <Input id="editFormProductPrice" type="number" value={editFormProductPrice} onChange={(e) => setEditFormProductPrice(e.target.value)} className="col-span-3" required step="0.01" min="0"/>
                </div>
                {editFormProductType === "PRODUCTO" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editFormProductSku" className="text-right col-span-1">SKU</Label>
                    <Input id="editFormProductSku" value={editFormProductSku} onChange={(e) => setEditFormProductSku(e.target.value)} className="col-span-3" />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editFormProductCategory" className="text-right col-span-1">Category</Label>
                  <Input id="editFormProductCategory" value={editFormProductCategory} onChange={(e) => setEditFormProductCategory(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editFormProductIsActive" className="text-right col-span-1">Active</Label>
                  <Switch id="editFormProductIsActive" checked={editFormProductIsActive} onCheckedChange={setEditFormProductIsActive} className="col-span-3 justify-self-start"/>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsEditProductDialogOpen(false)}>Cancel</Button></DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-lg">Product & Service List ({products.length})</CardTitle>
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
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-xs">{product.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.type === 'PRODUCTO' ? "secondary" : "outline"}>
                        {product.type === 'PRODUCTO' ? 'Product' : 'Service'}
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
                           <DropdownMenuItem onClick={() => openEditProductDialog(product)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditProductDialog(product)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {products.length === 0 && (
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
        Showing {products.length} of {products.length} products/services. Pagination controls will be added here.
      </div>
    </div>
  );
}
    

    