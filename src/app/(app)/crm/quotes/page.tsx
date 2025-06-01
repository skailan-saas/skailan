
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, FileText, Search, Filter, MoreHorizontal, Edit, Eye, Trash2, Send, Download, CalendarDays, PackagePlus, Printer, Zap as OpportunityIcon, Textarea as TextareaIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useMemo, useCallback, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { QuotePreview } from "@/components/crm/QuotePreview"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider, Controller, useFieldArray } from "react-hook-form";
import type { ProductType as PrismaProductType, QuoteStatus as PrismaQuoteStatus } from '@prisma/client';
import { 
    getQuotes, createQuote, updateQuote, deleteQuote,
    getLeadsForSelect, getProductsForSelect,
    type QuoteFE, type QuoteLineItemFE, type QuoteFormValues as ServerQuoteFormValues, QuoteFormSchema as ServerQuoteFormSchema
} from './actions';
import { Textarea } from "@/components/ui/textarea"; // Added import

const QUOTE_STATUSES_CLIENT = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELED"] as const;
type QuoteStatusClient = typeof QUOTE_STATUSES_CLIENT[number];

interface ProductForSelect {
  id: string;
  name: string;
  price: number;
  type: PrismaProductType;
}

interface OpportunityForSelect {
  id: string;
  name: string;
}

// Client-side Zod schema for form validation, ensuring client-side enum matches
const QuoteLineItemSchemaClient = ServerQuoteFormSchema.shape.lineItems.element;
const QuoteFormSchemaClient = ServerQuoteFormSchema.extend({
    status: z.enum(QUOTE_STATUSES_CLIENT)
});
type QuoteFormValuesClient = z.infer<typeof QuoteFormSchemaClient>;


export default function CrmQuotesPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [productsForSelect, setProductsForSelect] = useState<ProductForSelect[]>([]);
  const [opportunitiesForSelect, setOpportunitiesForSelect] = useState<OpportunityForSelect[]>([]);

  const [isAddOrEditQuoteDialogOpen, setIsAddOrEditQuoteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteFE | null>(null);
  
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [quoteToPreview, setQuoteToPreview] = useState<QuoteFE | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);

  const quoteForm = useForm<QuoteFormValuesClient>({
    resolver: zodResolver(QuoteFormSchemaClient),
    defaultValues: {
        opportunityId: "", 
        expiryDate: "",
        status: "DRAFT",
        lineItems: [],
        notes: "",
    }
  });

  const { fields: lineItemFields, append: appendLineItem, remove: removeLineItem, update: updateLineItem } = useFieldArray({
    control: quoteForm.control,
    name: "lineItems",
  });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedQuotes, fetchedOpportunities, fetchedProducts] = await Promise.all([
        getQuotes(),
        getLeadsForSelect(),
        getProductsForSelect(),
      ]);
      setQuotes(fetchedQuotes);
      setOpportunitiesForSelect(fetchedOpportunities);
      setProductsForSelect(fetchedProducts);
    } catch (error: any) {
      toast({ title: "Error Fetching Data", description: error.message || "Could not load page data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const currentLineItemsWatch = quoteForm.watch("lineItems");
  const calculatedTotalAmount = useMemo(() => {
    return (currentLineItemsWatch || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [currentLineItemsWatch]);


  useEffect(() => {
    if (isAddOrEditQuoteDialogOpen) {
      if (editingQuote) {
        quoteForm.reset({
          opportunityId: editingQuote.opportunityId || "", 
          expiryDate: editingQuote.expiryDate ? new Date(editingQuote.expiryDate).toISOString().split('T')[0] : "",
          status: editingQuote.status as QuoteStatusClient,
          lineItems: editingQuote.lineItems.map(li => ({
            id: li.id, // Keep existing ID for updates if necessary
            productId: li.productId,
            productName: li.productName,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
          notes: editingQuote.notes || "",
        });
      } else {
        quoteForm.reset({ opportunityId: "", expiryDate: "", status: "DRAFT", lineItems: [], notes: "" });
      }
    }
  }, [isAddOrEditQuoteDialogOpen, editingQuote, quoteForm]);


  const handleProductSelectionForLineItem = (index: number, productId: string) => {
    const product = productsForSelect.find(p => p.id === productId);
    if (product) {
      updateLineItem(index, {
        ...currentLineItemsWatch[index],
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
      });
    }
  };

  const handleActualSaveQuote = async (values: QuoteFormValuesClient) => {
    try {
      quoteForm.control._formState.isSubmitting = true;
      const serverValues: ServerQuoteFormValues = {
        ...values,
        lineItems: values.lineItems.map(li => ({ // Ensure only necessary fields are sent
            productId: li.productId,
            productName: productsForSelect.find(p => p.id === li.productId)?.name || 'Unknown Product', // Ensure product name is current
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
            ...(li.id && { id: li.id }) // Include ID if it exists (for updates)
        })),
        status: values.status as PrismaQuoteStatus, // Cast to Prisma type
      };

      if (editingQuote) {
        await updateQuote(editingQuote.id, serverValues);
        toast({ title: "Quote Updated", description: `Quote ${editingQuote.quoteNumber} has been updated.` });
      } else {
        await createQuote(serverValues);
        toast({ title: "Quote Added", description: `Quote for opportunity has been added.` });
      }
      
      setIsAddOrEditQuoteDialogOpen(false);
      setEditingQuote(null);
      fetchPageData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error Saving Quote", description: error.message || "Could not save quote.", variant: "destructive" });
    } finally {
       quoteForm.control._formState.isSubmitting = false;
    }
  };

  const openEditQuoteDialog = (quote: QuoteFE) => {
    setEditingQuote(quote);
    setIsAddOrEditQuoteDialogOpen(true);
  };

  const openAddQuoteDialog = () => {
    setEditingQuote(null); 
    setIsAddOrEditQuoteDialogOpen(true);
  };

  const triggerDeleteConfirmation = (id: string) => {
    setQuoteToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteQuote = async () => {
    if (!quoteToDeleteId) return;
    const quoteNameToDelete = quotes.find(q => q.id === quoteToDeleteId)?.quoteNumber || "Quote";
    try {
        const result = await deleteQuote(quoteToDeleteId);
        if (result.success) {
            toast({ title: "Quote Deleted", description: `Quote "${quoteNameToDelete}" has been marked as deleted.` });
            fetchPageData(); // Refresh list
        } else {
            toast({ title: "Error Deleting Quote", description: result.message || "Could not delete quote.", variant: "destructive" });
        }
    } catch (error: any) {
         toast({ title: "Error Deleting Quote", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsDeleteConfirmOpen(false);
    setQuoteToDeleteId(null);
  };

  const openPreviewDialog = (quote: QuoteFE) => {
    setQuoteToPreview(quote);
    setIsPreviewDialogOpen(true);
  };

  const handlePrintQuote = () => {
    window.print();
  };
  
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading quotes...</div>;
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><FileText className="mr-3 h-8 w-8 text-primary"/>Quotes Management</h1>
          <p className="text-muted-foreground">
            Create, send, and track your sales quotes for opportunities.
          </p>
        </div>
        <Dialog open={isAddOrEditQuoteDialogOpen} onOpenChange={(isOpen) => {
          setIsAddOrEditQuoteDialogOpen(isOpen);
          if (!isOpen) setEditingQuote(null); 
        }}>
          <DialogTrigger asChild>
            <Button onClick={openAddQuoteDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px] md:max-w-3xl lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingQuote ? `Edit Quote: ${editingQuote.quoteNumber}` : "Create New Quote"}</DialogTitle>
              <DialogDescription>Enter the details for the sales quote.</DialogDescription>
            </DialogHeader>
            <FormProvider {...quoteForm}>
            <form onSubmit={quoteForm.handleSubmit(handleActualSaveQuote)}>
              <ScrollArea className="max-h-[65vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={quoteForm.control} name="opportunityId" render={({ field }) => ( <FormItem> <FormLabel>Opportunity</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder="Select an opportunity" /></SelectTrigger> </FormControl> <SelectContent>{opportunitiesForSelect.map(opp => ( <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem> ))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                    <FormField control={quoteForm.control} name="expiryDate" render={({ field }) => ( <FormItem> <FormLabel>Expiry Date</FormLabel> <div className="relative"> <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> <FormControl><Input type="date" className="pl-10" {...field} value={field.value || ''} /></FormControl> </div> <FormMessage /> </FormItem> )}/>
                  </div>
                  <FormField control={quoteForm.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Status</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger> </FormControl> <SelectContent>{QUOTE_STATUSES_CLIENT.map(status => <SelectItem key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                  
                  <FormField control={quoteForm.control} name="notes" render={({ field }) => ( <FormItem> <FormLabel>Notes / Terms</FormLabel> <FormControl><Textarea placeholder="Enter any notes or terms and conditions for this quote..." {...field} value={field.value ?? ""} rows={3}/></FormControl> <FormMessage /> </FormItem> )}/>

                  <div className="space-y-3 pt-4 border-t mt-2">
                    <h3 className="text-md font-semibold">Line Items</h3>
                     {lineItemFields.map((field, index) => (
                        <Card key={field.id} className="p-3 space-y-2 bg-muted/30 mb-2">
                            <div className="flex justify-between items-center">
                                <Label>Item {index + 1}</Label>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="text-destructive hover:text-destructive/80 h-7 w-7">
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                <div className="sm:col-span-6">
                                <FormField control={quoteForm.control} name={`lineItems.${index}.productId`} render={({ field: itemField }) => ( <FormItem> <FormLabel className="text-xs">Product/Service</FormLabel> <Select onValueChange={(value) => { itemField.onChange(value); handleProductSelectionForLineItem(index, value); }} value={itemField.value}> <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select item" /></SelectTrigger></FormControl> <SelectContent>{productsForSelect.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                                </div>
                                <div className="sm:col-span-2">
                                <FormField control={quoteForm.control} name={`lineItems.${index}.quantity`} render={({ field: itemField }) => ( <FormItem> <FormLabel className="text-xs">Qty</FormLabel> <FormControl><Input type="number" min="1" {...itemField} onChange={e => itemField.onChange(parseFloat(e.target.value) || 1)} className="h-9 text-center" /></FormControl> <FormMessage /> </FormItem> )}/>
                                </div>
                                <div className="sm:col-span-3">
                                <FormField control={quoteForm.control} name={`lineItems.${index}.unitPrice`} render={({ field: itemField }) => ( <FormItem> <FormLabel className="text-xs">Unit Price ($)</FormLabel> <FormControl><Input type="number" step="0.01" min="0" {...itemField} onChange={e => itemField.onChange(parseFloat(e.target.value) || 0)} className="h-9" /></FormControl> <FormMessage /> </FormItem> )}/>
                                </div>
                                {/* Total per item (display only) */}
                                <div className="sm:col-span-1 flex items-end pb-1">
                                    <p className="text-sm font-medium text-right w-full">
                                        ${((currentLineItemsWatch?.[index]?.quantity || 0) * (currentLineItemsWatch?.[index]?.unitPrice || 0)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                     ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendLineItem({ productId: "", productName: "", quantity: 1, unitPrice: 0})} className="w-full mt-2">
                        <PackagePlus className="mr-2 h-4 w-4"/> Add Line Item
                    </Button>
                    
                    <div className="text-right font-bold text-lg mt-4">
                      Total Quote Amount: ${calculatedTotalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={quoteForm.formState.isSubmitting}>
                  {editingQuote ? (quoteForm.formState.isSubmitting ? "Saving..." : "Save Changes") : (quoteForm.formState.isSubmitting ? "Creating..." : "Create Quote")}
                </Button>
              </DialogFooter>
            </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-lg">All Quotes ({quotes.length})</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search quotes..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" />
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
             {quotes.length === 0 && !isLoading ? (
                <div className="text-center py-20"> <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> <h3 className="text-xl font-semibold text-foreground">No Quotes Found</h3> <p className="text-muted-foreground"> Create your first quote to get started. </p> </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead className="hidden md:table-cell">Date Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.opportunityName || "N/A"}</TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(quote.dateCreated).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden lg:table-cell">{quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={ quote.status === "ACCEPTED" ? "default" : quote.status === "SENT" ? "secondary" : quote.status === "REJECTED" || quote.status === "CANCELED" || quote.status === "EXPIRED" ? "destructive" : "outline" } className={quote.status === "ACCEPTED" ? "bg-green-600 text-white" : ""}>
                        {String(quote.status).charAt(0) + String(quote.status).slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${quote.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild> <Button variant="ghost" size="icon"> <MoreHorizontal className="h-4 w-4" /> </Button> </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreviewDialog(quote)}><Eye className="mr-2 h-4 w-4" /> View/Preview Quote</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditQuoteDialog(quote)}><Edit className="mr-2 h-4 w-4" /> Edit Quote</DropdownMenuItem>
                          <DropdownMenuItem disabled><Send className="mr-2 h-4 w-4" /> Send Quote</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerDeleteConfirmation(quote.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Quote
                          </DropdownMenuItem>
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

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0">
          <DialogHeader className="p-4 pb-0 no-print"> <DialogTitle>Quote Preview: {quoteToPreview?.quoteNumber}</DialogTitle> <DialogDescription>Review the quote details before printing or sending.</DialogDescription> </DialogHeader>
          <ScrollArea className="max-h-[75vh] print:max-h-full print:overflow-visible"> <QuotePreview quote={quoteToPreview} /> </ScrollArea>
          <DialogFooter className="p-4 border-t bg-background sm:justify-start no-print"> <Button onClick={handlePrintQuote} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground"> <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF </Button> <DialogClose asChild> <Button type="button" variant="outline">Close</Button> </DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Are you sure?</AlertDialogTitle> <AlertDialogDescription> This action will mark quote "{quotes.find(q => q.id === quoteToDeleteId)?.quoteNumber || 'this quote'}" as deleted. </AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel onClick={() => {setQuoteToDeleteId(null); setIsDeleteConfirmOpen(false);}} type="button">Cancel</AlertDialogCancel> <AlertDialogAction onClick={confirmDeleteQuote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"> Delete Quote </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent>
      </AlertDialog>

      <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {quotes.length} of {quotes.length} quotes. Pagination controls will be added here.
      </div>
    </div>
  );
}

