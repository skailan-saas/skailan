
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
import { PlusCircle, FileText, Search, Filter, MoreHorizontal, Edit, Eye, Trash2, Send, Download, CalendarDays, PackagePlus, Printer, Zap as OpportunityIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { QuotePreview } from "@/components/crm/QuotePreview"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Aligned with prisma schema QuoteStatus enum
const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELED"] as const;
type QuoteStatus = typeof QUOTE_STATUSES[number];

interface Product {
  id: string;
  name: string;
  price: number;
  type: "PRODUCTO" | "SERVICIO";
}

const mockProducts: Product[] = [
  { id: "prod-1", name: "Premium Website Development", price: 5000, type: "SERVICIO" },
  { id: "prod-2", name: "Wireless Noise-Cancelling Headphones", price: 199.99, type: "PRODUCTO" },
  { id: "prod-3", name: "Monthly SEO Consulting", price: 750, type: "SERVICIO"},
  { id: "prod-4", name: "E-commerce Platform Setup", price: 3500, type: "SERVICIO"},
  { id: "prod-5", name: "Graphic Design Package", price: 1200, type: "SERVICIO"},
];

// Representing Opportunities for selection, derived from previous Lead concept
interface OpportunityForQuote {
  id: string; // This will be opportunityId
  name: string; // Opportunity Name (e.g., "Opp Alpha (Lead Name)")
  dataAiHint?: string;
}

const mockOpportunitiesForQuote: OpportunityForQuote[] = [
    { id: "opp-1", name: "Opportunity Alpha (Alice W.)", dataAiHint: "woman face" },
    { id: "opp-2", name: "Opportunity Beta (Bob T.)", dataAiHint: "man face" },
    { id: "opp-3", name: "Opportunity Gamma (Charlie Brown)", dataAiHint: "boy face" },
    { id: "opp-4", name: "Opportunity Delta (Diana Prince)", dataAiHint: "woman hero" },
];


export interface QuoteLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  opportunityName: string; 
  opportunityId: string; 
  dateCreated: string;
  expiryDate?: string;
  status: QuoteStatus;
  lineItems: QuoteLineItem[];
  totalAmount: number;
  dataAiHint?: string;
}

const initialQuotesData: Quote[] = [
  {
    id: "quote-1",
    quoteNumber: "QT-2024-001",
    opportunityName: "Opportunity Alpha (Alice W.)", 
    opportunityId: "opp-1", 
    dateCreated: "2024-07-20",
    expiryDate: "2024-08-20",
    status: "SENT",
    lineItems: [
      { id: "qli-1-1", productId: "prod-1", productName: "Premium Website Development", quantity: 1, unitPrice: 5000, total: 5000 },
      { id: "qli-1-2", productId: "prod-3", productName: "Monthly SEO Consulting", quantity: 1, unitPrice: 250, total: 250 },
    ],
    totalAmount: 5250.00,
    dataAiHint: "document contract",
  },
  {
    id: "quote-2",
    quoteNumber: "QT-2024-002",
    opportunityName: "Opportunity Beta (Bob T.)", 
    opportunityId: "opp-2", 
    dateCreated: "2024-07-22",
    expiryDate: "2024-08-22",
    status: "ACCEPTED",
    lineItems: [
      { id: "qli-2-1", productId: "prod-2", productName: "Wireless Noise-Cancelling Headphones", quantity: 5, unitPrice: 199.99, total: 999.95 },
      { id: "qli-2-2", productId: "prod-5", productName: "Graphic Design Package", quantity: 1, unitPrice: 800.55, total: 800.55 },
    ],
    totalAmount: 1800.50,
    dataAiHint: "invoice paper",
  },
];

const QuoteFormSchema = z.object({
    opportunityId: z.string().min(1, "Opportunity is required"), 
    expiryDate: z.string().optional(),
    status: z.enum(QUOTE_STATUSES, { required_error: "Quote status is required" }),
});
type QuoteFormValues = z.infer<typeof QuoteFormSchema>;


export default function CrmQuotesPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotesData);
  const [isAddOrEditQuoteDialogOpen, setIsAddOrEditQuoteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const [currentLineItems, setCurrentLineItems] = useState<QuoteLineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number | string>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number | string>("");

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [quoteToPreview, setQuoteToPreview] = useState<Quote | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);

  const quoteForm = useForm<QuoteFormValues>({
    resolver: zodResolver(QuoteFormSchema),
    defaultValues: {
        opportunityId: "", 
        expiryDate: "",
        status: "DRAFT",
    }
  });


  const calculatedTotalAmount = useMemo(() => {
    return currentLineItems.reduce((sum, item) => sum + item.total, 0);
  }, [currentLineItems]);

  const resetDialogFormFields = () => {
    quoteForm.reset({ opportunityId: "", expiryDate: "", status: "DRAFT" });
    setCurrentLineItems([]);
    setSelectedProductId("");
    setItemQuantity(1);
    setItemUnitPrice("");
  };

  useEffect(() => {
    if (isAddOrEditQuoteDialogOpen) {
      if (editingQuote) {
        quoteForm.reset({
          opportunityId: editingQuote.opportunityId || "", 
          expiryDate: editingQuote.expiryDate || "",
          status: editingQuote.status,
        });
        setCurrentLineItems([...editingQuote.lineItems]);
      } else {
        resetDialogFormFields();
      }
    }
  }, [isAddOrEditQuoteDialogOpen, editingQuote, quoteForm]);


  const handleProductSelectionChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = mockProducts.find(p => p.id === productId);
    if (product) {
      setItemUnitPrice(product.price);
    } else {
      setItemUnitPrice("");
    }
  };

  const handleAddLineItem = () => {
    const product = mockProducts.find(p => p.id === selectedProductId);
    const quantity = Number(itemQuantity);
    const unitPrice = Number(itemUnitPrice);

    if (!product || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice < 0) {
      toast({ title: "Invalid Item", description: "Please select a product and enter valid quantity/price.", variant: "destructive" });
      return;
    }
    const newLineItem: QuoteLineItem = {
      id: `qli-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };
    setCurrentLineItems(prev => [...prev, newLineItem]);
    setSelectedProductId("");
    setItemQuantity(1);
    setItemUnitPrice("");
  };

  const handleRemoveLineItem = (itemId: string) => {
    setCurrentLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleActualSaveQuote = (values: QuoteFormValues) => {
    const selectedOpp = mockOpportunitiesForQuote.find(l => l.id === values.opportunityId); 
    if (!selectedOpp) { 
        toast({ title: "Missing Opportunity", description: "Please select an opportunity.", variant: "destructive" });
        return;
    }
    if (currentLineItems.length === 0) {
        toast({ title: "No Line Items", description: "Please add at least one item to the quote.", variant: "destructive" });
        return;
    }

    const quoteData = {
      opportunityId: selectedOpp.id, 
      opportunityName: selectedOpp.name, 
      expiryDate: values.expiryDate || undefined,
      status: values.status,
      lineItems: currentLineItems,
      totalAmount: calculatedTotalAmount,
      dataAiHint: "document paper",
    };

    if (editingQuote) {
      const updatedQuote: Quote = { ...editingQuote, ...quoteData }; 
      setQuotes(prevQuotes => prevQuotes.map(q => q.id === editingQuote.id ? updatedQuote : q));
      toast({ title: "Quote Updated", description: `Quote ${updatedQuote.quoteNumber} has been updated.` });
    } else {
      const newQuoteToAdd: Quote = {
        id: `quote-${Date.now()}`,
        quoteNumber: `QT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
        dateCreated: new Date().toISOString().split('T')[0],
        ...quoteData,
      };
      setQuotes(prevQuotes => [newQuoteToAdd, ...prevQuotes]);
      toast({ title: "Quote Added", description: `Quote for ${newQuoteToAdd.opportunityName} has been added.` });
    }
    
    setIsAddOrEditQuoteDialogOpen(false);
    setEditingQuote(null);
    resetDialogFormFields(); 
  };

  const openEditQuoteDialog = (quote: Quote) => {
    setEditingQuote(quote);
    setIsAddOrEditQuoteDialogOpen(true);
  };

  const openAddQuoteDialog = () => {
    setEditingQuote(null); 
    resetDialogFormFields();
    setIsAddOrEditQuoteDialogOpen(true);
  };

  const triggerDeleteConfirmation = (id: string) => {
    setQuoteToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteQuote = () => {
    if (!quoteToDeleteId) return;
    const quoteName = quotes.find(q => q.id === quoteToDeleteId)?.quoteNumber || "Quote";
    setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteToDeleteId));
    toast({ title: "Quote Deleted", description: `${quoteName} has been removed.` });
    setIsDeleteConfirmOpen(false);
    setQuoteToDeleteId(null);
  };

  const openPreviewDialog = (quote: Quote) => {
    setQuoteToPreview(quote);
    setIsPreviewDialogOpen(true);
  };

  const handlePrintQuote = () => {
    window.print();
  };

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
                    <FormField
                        control={quoteForm.control}
                        name="opportunityId" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Opportunity</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select an opportunity" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {mockOpportunitiesForQuote.map(opp => (
                                        <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={quoteForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                 <div className="relative">
                                     <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                     <FormControl><Input type="date" className="pl-10" {...field} /></FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  </div>
                  <FormField
                    control={quoteForm.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>{QUOTE_STATUSES.map(status => <SelectItem key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  

                  <div className="space-y-3 pt-4 border-t mt-2">
                    <h3 className="text-md font-semibold">Line Items</h3>
                    <div className="grid grid-cols-12 items-end gap-2 p-2 border rounded-md bg-muted/30">
                      <div className="col-span-12 sm:col-span-5">
                        <Label htmlFor="selectedProduct">Product/Service</Label>
                        <Select value={selectedProductId} onValueChange={handleProductSelectionChange}>
                          <SelectTrigger id="selectedProduct"><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>
                            {mockProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Label htmlFor="itemQuantity">Qty</Label>
                        <Input id="itemQuantity" type="number" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} min="1" className="text-center"/>
                      </div>
                      <div className="col-span-8 sm:col-span-3">
                        <Label htmlFor="itemUnitPrice">Unit Price ($)</Label>
                        <Input id="itemUnitPrice" type="number" value={itemUnitPrice} onChange={e => setItemUnitPrice(e.target.value)} step="0.01" min="0" />
                      </div>
                      <div className="col-span-12 sm:col-span-2">
                        <Button type="button" onClick={handleAddLineItem} className="w-full bg-primary/80 hover:bg-primary/70 text-primary-foreground">
                          <PackagePlus className="h-4 w-4 sm:mr-2"/> <span className="hidden sm:inline">Add</span>
                        </Button>
                      </div>
                    </div>

                    {currentLineItems.length > 0 && (
                      <div className="mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product/Service</TableHead>
                              <TableHead className="text-center w-[70px]">Qty</TableHead>
                              <TableHead className="text-right w-[100px]">Unit Price</TableHead>
                              <TableHead className="text-right w-[100px]">Total</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentLineItems.map(item => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-semibold">${item.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLineItem(item.id)} className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="h-4 w-4"/>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    <div className="text-right font-bold text-lg mt-4">
                      Total Quote Amount: ${calculatedTotalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={quoteForm.formState.isSubmitting}>
                  {editingQuote ? "Save Changes" : "Save Quote"}
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
                    <TableCell>{quote.opportunityName}</TableCell>
                    <TableCell className="hidden md:table-cell">{quote.dateCreated}</TableCell>
                    <TableCell className="hidden lg:table-cell">{quote.expiryDate || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                            quote.status === "ACCEPTED" ? "default" :
                            quote.status === "SENT" ? "secondary" :
                            quote.status === "REJECTED" || quote.status === "CANCELED" || quote.status === "EXPIRED" ? "destructive" :
                            "outline"
                        }
                        className={quote.status === "ACCEPTED" ? "bg-green-600 text-white" : ""}
                      >
                        {quote.status.charAt(0) + quote.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${quote.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreviewDialog(quote)}><Eye className="mr-2 h-4 w-4" /> View/Preview Quote</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditQuoteDialog(quote)}><Edit className="mr-2 h-4 w-4" /> Edit Quote</DropdownMenuItem>
                          <DropdownMenuItem><Send className="mr-2 h-4 w-4" /> Send Quote</DropdownMenuItem>
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
            {quotes.length === 0 && (
                <div className="text-center py-20">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Quotes Found</h3>
                    <p className="text-muted-foreground">
                    Create your first quote to get started.
                    </p>
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quote Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0">
          <DialogHeader className="p-4 pb-0 no-print">
            <DialogTitle>Quote Preview: {quoteToPreview?.quoteNumber}</DialogTitle>
             <DialogDescription>Review the quote details before printing or sending.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] print:max-h-full print:overflow-visible"> 
            <QuotePreview quote={quoteToPreview} />
          </ScrollArea>
          <DialogFooter className="p-4 border-t bg-background sm:justify-start no-print">
            <Button onClick={handlePrintQuote} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete quote 
              "{quotes.find(q => q.id === quoteToDeleteId)?.quoteNumber || 'this quote'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setQuoteToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {quotes.length} of {quotes.length} quotes. Pagination controls will be added here.
      </div>
    </div>
  );
}
