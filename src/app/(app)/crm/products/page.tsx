
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Package, Search, Filter, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getProducts, createProduct, updateProduct, deleteProduct, type ProductFE } from './actions';
import { ProductFormSchema, type ProductFormValues } from '@/lib/schemas/crm/product-schema';
import type { ProductType as PrismaProductType } from '@prisma/client';


const PRODUCT_TYPES_CLIENT = ["PRODUCTO", "SERVICIO"] as const;
type ProductTypeClient = typeof PRODUCT_TYPES_CLIENT[number];

// Client-side Zod schema for form validation, ensuring client-side enum matches
const ProductFormSchemaClient = ProductFormSchema.extend({
  type: z.enum(PRODUCT_TYPES_CLIENT)
});
type ProductFormValuesClient = z.infer<typeof ProductFormSchemaClient>;


export default function CrmProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFE | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isViewProductDialogOpen, setIsViewProductDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<ProductFE | null>(null);

  const addProductForm = useForm<ProductFormValuesClient>({
    resolver: zodResolver(ProductFormSchemaClient),
    defaultValues: {
      name: "", type: "PRODUCTO", description: "", price: 0, sku: "", category: "", isActive: true,
    },
  });

  const editProductForm = useForm<ProductFormValuesClient>({
    resolver: zodResolver(ProductFormSchemaClient),
  });

  const fetchProductsCallback = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts.map(p => ({...p, dataAiHint: p.type === "PRODUCTO" ? "item object" : "service gear"})));
    } catch (error: any) {
      toast({ title: "Error Fetching Products", description: error.message || "Could not fetch products.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProductsCallback();
  }, [fetchProductsCallback]);

  useEffect(() => {
    if (editingProduct) {
      editProductForm.reset({
        name: editingProduct.name,
        type: editingProduct.type as ProductTypeClient, // Cast from Prisma type
        description: editingProduct.description || "",
        price: editingProduct.price,
        sku: editingProduct.sku || "",
        category: editingProduct.category || "",
        isActive: editingProduct.isActive,
      });
    }
  }, [editingProduct, editProductForm]);

  const handleActualAddProductSubmit = async (values: ProductFormValuesClient) => {
    try {
      addProductForm.control._formState.isSubmitting = true;
      await createProduct(values as ProductFormValues); // Cast to server type for the action
      toast({ title: "Product/Service Added", description: `${values.name} has been added.` });
      addProductForm.reset();
      setIsAddProductDialogOpen(false);
      fetchProductsCallback();
    } catch (error: any) {
       toast({ title: "Error Adding Product", description: error.message || "Could not add product.", variant: "destructive" });
    } finally {
      addProductForm.control._formState.isSubmitting = false;
    }
  };

  const openEditProductDialog = (product: ProductFE) => {
    setEditingProduct(product);
    setIsEditProductDialogOpen(true);
  };

  const openViewProductDialog = (product: ProductFE) => {
    setViewingProduct(product);
    setIsViewProductDialogOpen(true);
  };

  const handleActualEditProductSubmit = async (values: ProductFormValuesClient) => {
    if (!editingProduct) return;
    try {
      editProductForm.control._formState.isSubmitting = true;
      await updateProduct(editingProduct.id, values as ProductFormValues);
      toast({ title: "Product/Service Updated", description: `${values.name} has been updated.` });
      setIsEditProductDialogOpen(false);
      setEditingProduct(null);
      fetchProductsCallback();
    } catch (error: any) {
       toast({ title: "Error Updating Product", description: error.message || "Could not update product.", variant: "destructive" });
    } finally {
      editProductForm.control._formState.isSubmitting = false;
    }
  };

  const triggerDeleteConfirmation = (id: string) => {
    setProductToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDeleteId) return;
    const productNameToDelete = products.find(p => p.id === productToDeleteId)?.name || "Product/Service";
    try {
        const result = await deleteProduct(productToDeleteId);
        if (result.success) {
            toast({ title: "Product/Service Deleted", description: `"${productNameToDelete}" has been marked as deleted.` });
            fetchProductsCallback();
        } else {
            toast({ title: "Error Deleting Product", description: result.message || "Could not delete product.", variant: "destructive" });
        }
    } catch (error: any) {
         toast({ title: "Error Deleting Product", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsDeleteConfirmOpen(false);
    setProductToDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Package className="mr-3 h-8 w-8 text-primary"/>Products &amp; Services</h1>
          <p className="text-muted-foreground">
            Manage your product and service catalog.
          </p>
        </div>
        <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => { addProductForm.reset(); setIsAddProductDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product/Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Add New Product or Service</DialogTitle>
              <DialogDescription>Enter the details for the new item.</DialogDescription>
            </DialogHeader>
            <FormProvider {...addProductForm}>
              <form onSubmit={addProductForm.handleSubmit(handleActualAddProductSubmit)}>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addProductForm.control} name="name" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Name</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Premium Subscription" {...field} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProductForm.control} name="type" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{PRODUCT_TYPES_CLIENT.map(type => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</SelectItem>)}</SelectContent></Select><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProductForm.control} name="description" render={({ field }) => (<FormItem className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea placeholder="Describe the item" {...field} rows={3}/></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProductForm.control} name="price" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Price ($)</FormLabel><FormControl className="col-span-3"><Input type="number" placeholder="e.g., 99.99" {...field} step="0.01" min="0"/></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  {addProductForm.watch("type") === "PRODUCTO" && (<FormField control={addProductForm.control} name="sku" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">SKU</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., PROD-001" {...field} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} /> )}
                  <FormField control={addProductForm.control} name="category" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Category</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Software" {...field} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addProductForm.control} name="isActive" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Active</FormLabel><FormControl className="col-span-3 justify-self-start"><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addProductForm.formState.isSubmitting}>
                    {addProductForm.formState.isSubmitting ? "Saving..." : "Save Product/Service"}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditProductDialogOpen} onOpenChange={(isOpen) => { setIsEditProductDialogOpen(isOpen); if (!isOpen) setEditingProduct(null); }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Edit: {editingProduct?.name}</DialogTitle><DialogDescription>Update the details for this product or service.</DialogDescription></DialogHeader>
          {editingProduct && (
          <FormProvider {...editProductForm}>
              <form onSubmit={editProductForm.handleSubmit(handleActualEditProductSubmit)}>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={editProductForm.control} name="name" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Name</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProductForm.control} name="type" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{PRODUCT_TYPES_CLIENT.map(type => <SelectItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</SelectItem>)}</SelectContent></Select><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProductForm.control} name="description" render={({ field }) => (<FormItem className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Description</FormLabel><FormControl className="col-span-3"><Textarea {...field} rows={3}/></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProductForm.control} name="price" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Price ($)</FormLabel><FormControl className="col-span-3"><Input type="number" {...field} step="0.01" min="0"/></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  {editProductForm.watch("type") === "PRODUCTO" && (<FormField control={editProductForm.control} name="sku" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">SKU</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />)}
                  <FormField control={editProductForm.control} name="category" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Category</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editProductForm.control} name="isActive" render={({ field }) => (<FormItem className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Active</FormLabel><FormControl className="col-span-3 justify-self-start"><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsEditProductDialogOpen(false)}>Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editProductForm.formState.isSubmitting}>
                     {editProductForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewProductDialogOpen} onOpenChange={setIsViewProductDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Product Details: {viewingProduct?.name}</DialogTitle><DialogDescription>Read-only view of the product/service information.</DialogDescription></DialogHeader>
          {viewingProduct && (
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
              <div className="space-y-3 py-4 text-sm">
                <div><p className="font-medium text-muted-foreground">Name:</p><p>{viewingProduct.name}</p></div>
                <div><p className="font-medium text-muted-foreground">Type:</p><div><Badge variant={viewingProduct.type === 'PRODUCTO' ? "secondary" : "outline"}>{String(viewingProduct.type)}</Badge></div></div>
                {viewingProduct.description && (<div><p className="font-medium text-muted-foreground">Description:</p><p className="whitespace-pre-wrap">{viewingProduct.description}</p></div>)}
                <div><p className="font-medium text-muted-foreground">Price:</p><p>${viewingProduct.price.toFixed(2)}</p></div>
                {viewingProduct.type === "PRODUCTO" && viewingProduct.sku && (<div><p className="font-medium text-muted-foreground">SKU:</p><p>{viewingProduct.sku}</p></div>)}
                {viewingProduct.category && (<div><p className="font-medium text-muted-foreground">Category:</p><p>{viewingProduct.category}</p></div>)}
                <div><p className="font-medium text-muted-foreground">Status:</p><div><Badge variant={viewingProduct.isActive ? "default" : "destructive"} className={viewingProduct.isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{viewingProduct.isActive ? "Active" : "Inactive"}</Badge></div></div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will mark product/service "{products.find(p => p.id === productToDeleteId)?.name || 'this item'}" as deleted. It can be recovered by an administrator.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => {setProductToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteProduct} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-lg">Product &amp; Service List ({products.length})</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search products..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" /></div>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /><span className="sr-only">Filter</span></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {isLoading ? (<div className="text-center py-20 text-muted-foreground">Loading products...</div>) :
            products.length === 0 ? (
                <div className="text-center py-20"><Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold text-foreground">No Products or Services Found</h3><p className="text-muted-foreground">Add your first product or service to get started.</p></div>
            ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="hidden md:table-cell">Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell><div className="font-medium">{product.name}</div><div className="text-xs text-muted-foreground hidden sm:block truncate max-w-xs">{product.description}</div></TableCell>
                    <TableCell><Badge variant={product.type === 'PRODUCTO' ? "secondary" : "outline"}>{String(product.type).charAt(0) + String(product.type).slice(1).toLowerCase()}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{product.category || "N/A"}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant={product.isActive ? "default" : "destructive"} className={product.isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>{product.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => openViewProductDialog(product)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => openEditProductDialog(product)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerDeleteConfirmation(product.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
