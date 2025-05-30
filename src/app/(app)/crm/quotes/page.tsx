
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, FileText, Search, Filter, MoreHorizontal, Edit, Eye, Trash2, Send, Download, CalendarDays, PackagePlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELED"] as const;
type QuoteStatus = typeof QUOTE_STATUSES[number];

// Simplified Product interface for quotes page - in a real app, this would come from a shared store/API
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


interface QuoteLineItem {
  id: string; // Unique ID for the line item itself
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  leadName: string; 
  leadId?: string;
  dateCreated: string;
  expiryDate?: string;
  status: QuoteStatus;
  lineItems: QuoteLineItem[];
  totalAmount: number; // This will be calculated
}

const initialQuotesData: Quote[] = [
  {
    id: "quote-1",
    quoteNumber: "QT-2024-001",
    leadName: "Alice W. (Wonderland Inc.)",
    leadId: "lead-1",
    dateCreated: "2024-07-20",
    expiryDate: "2024-08-20",
    status: "SENT",
    lineItems: [
      { id: "qli-1-1", productId: "prod-1", productName: "Premium Website Development", quantity: 1, unitPrice: 5000, total: 5000 },
      { id: "qli-1-2", productId: "prod-3", productName: "Monthly SEO Consulting", quantity: 1, unitPrice: 250, total: 250 },
    ],
    totalAmount: 5250.00,
  },
  {
    id: "quote-2",
    quoteNumber: "QT-2024-002",
    leadName: "Bob T. (Builders Co.)",
    leadId: "lead-2",
    dateCreated: "2024-07-22",
    expiryDate: "2024-08-22",
    status: "ACCEPTED",
    lineItems: [
      { id: "qli-2-1", productId: "prod-2", productName: "Wireless Noise-Cancelling Headphones", quantity: 5, unitPrice: 199.99, total: 999.95 },
      { id: "qli-2-2", productId: "prod-5", productName: "Graphic Design Package", quantity: 1, unitPrice: 800.55, total: 800.55 },
    ],
    totalAmount: 1800.50,
  },
];

export default function CrmQuotesPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotesData);
  const [isAddOrEditQuoteDialogOpen, setIsAddOrEditQuoteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Form state for Add/Edit Dialog
  const [currentLeadName, setCurrentLeadName] = useState("");
  const [currentExpiryDate, setCurrentExpiryDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState<QuoteStatus>("DRAFT");
  const [currentLineItems, setCurrentLineItems] = useState<QuoteLineItem[]>([]);

  // State for adding a new line item
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number | string>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number | string>("");

  const calculatedTotalAmount = useMemo(() => {
    return currentLineItems.reduce((sum, item) => sum + item.total, 0);
  }, [currentLineItems]);

  const resetDialogForm = () => {
    setCurrentLeadName("");
    setCurrentExpiryDate("");
    setCurrentStatus("DRAFT");
    setCurrentLineItems([]);
    setSelectedProductId("");
    setItemQuantity(1);
    setItemUnitPrice("");
    setEditingQuote(null);
  };

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
    // Reset line item form
    setSelectedProductId("");
    setItemQuantity(1);
    setItemUnitPrice("");
  };

  const handleRemoveLineItem = (itemId: string) => {
    setCurrentLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveQuote = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentLeadName.trim()) {
        toast({ title: "Missing Lead Name", description: "Please enter a name for the lead/customer.", variant: "destructive" });
        return;
    }
    if (currentLineItems.length === 0) {
        toast({ title: "No Line Items", description: "Please add at least one item to the quote.", variant: "destructive" });
        return;
    }

    const quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'dateCreated'> = {
      leadName: currentLeadName,
      expiryDate: currentExpiryDate || undefined,
      status: currentStatus,
      lineItems: currentLineItems,
      totalAmount: calculatedTotalAmount,
    };

    if (editingQuote) { // Update existing quote
      const updatedQuote: Quote = { ...editingQuote, ...quoteData };
      setQuotes(prevQuotes => prevQuotes.map(q => q.id === editingQuote.id ? updatedQuote : q));
      toast({ title: "Quote Updated", description: `Quote ${updatedQuote.quoteNumber} has been updated.` });
    } else { // Add new quote
      const newQuoteToAdd: Quote = {
        id: `quote-${Date.now()}`,
        quoteNumber: `QT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
        dateCreated: new Date().toISOString().split('T')[0],
        ...quoteData,
      };
      setQuotes(prevQuotes => [newQuoteToAdd, ...prevQuotes]);
      toast({ title: "Quote Added", description: `Quote for ${newQuoteToAdd.leadName} has been added.` });
    }
    
    resetDialogForm();
    setIsAddOrEditQuoteDialogOpen(false);
  };
  
  const openEditQuoteDialog = (quote: Quote) => {
    setEditingQuote(quote);
    setCurrentLeadName(quote.leadName);
    setCurrentExpiryDate(quote.expiryDate || "");
    setCurrentStatus(quote.status);
    setCurrentLineItems([...quote.lineItems]); // Create a new array copy
    setIsAddOrEditQuoteDialogOpen(true);
  };

  const openAddQuoteDialog = () => {
    resetDialogForm();
    setIsAddOrEditQuoteDialogOpen(true);
  };
  
  const handleDeleteQuote = (quoteId: string) => {
    setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId));
    toast({ title: "Quote Deleted (Demo)", description: "Quote has been removed." });
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><FileText className="mr-3 h-8 w-8 text-primary"/>Quotes Management</h1>
          <p className="text-muted-foreground">
            Create, send, and track your sales quotes.
          </p>
        </div>
        <Button onClick={openAddQuoteDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Quote
        </Button>
      </div>
      
      <Dialog open={isAddOrEditQuoteDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) resetDialogForm();
          setIsAddOrEditQuoteDialogOpen(isOpen);
        }}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>{editingQuote ? `Edit Quote: ${editingQuote.quoteNumber}` : "Create New Quote"}</DialogTitle>
            <DialogDescription>Enter the details for the sales quote.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveQuote}>
            <ScrollArea className="max-h-[65vh] p-1">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currentLeadName" className="text-right col-span-1">Lead/Customer</Label>
                  <Input id="currentLeadName" value={currentLeadName} onChange={(e) => setCurrentLeadName(e.target.value)} placeholder="e.g., Acme Corp" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currentExpiryDate" className="text-right col-span-1">Expiry Date</Label>
                  <div className="col-span-3 relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="currentExpiryDate" type="date" value={currentExpiryDate} onChange={(e) => setCurrentExpiryDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currentStatus" className="text-right col-span-1">Status</Label>
                  <Select value={currentStatus} onValueChange={(value: QuoteStatus) => setCurrentStatus(value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>{QUOTE_STATUSES.map(status => <SelectItem key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Line Items Section */}
                <div className="col-span-4 space-y-3 pt-4 border-t mt-2">
                  <h3 className="text-md font-semibold col-span-4">Line Items</h3>
                  <div className="grid grid-cols-12 items-end gap-2 p-2 border rounded-md bg-muted/30">
                    <div className="col-span-5">
                      <Label htmlFor="selectedProduct">Product/Service</Label>
                      <Select value={selectedProductId} onValueChange={handleProductSelectionChange}>
                        <SelectTrigger id="selectedProduct"><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent>
                          {mockProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="itemQuantity">Qty</Label>
                      <Input id="itemQuantity" type="number" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} min="1" className="text-center"/>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="itemUnitPrice">Unit Price ($)</Label>
                      <Input id="itemUnitPrice" type="number" value={itemUnitPrice} onChange={e => setItemUnitPrice(e.target.value)} step="0.01" min="0" />
                    </div>
                    <div className="col-span-2">
                      <Button type="button" onClick={handleAddLineItem} className="w-full bg-primary/80 hover:bg-primary/70 text-primary-foreground">
                        <PackagePlus className="h-4 w-4 sm:mr-2"/> <span className="hidden sm:inline">Add</span>
                      </Button>
                    </div>
                  </div>
                  
                  {currentLineItems.length > 0 && (
                    <div className="col-span-4 mt-2">
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
                  <div className="col-span-4 text-right font-bold text-lg mt-4">
                    Total Quote Amount: ${calculatedTotalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetDialogForm}>Cancel</Button></DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {editingQuote ? "Save Changes" : "Save Quote"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                  <TableHead>Lead / Customer</TableHead>
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
                    <TableCell>{quote.leadName}</TableCell>
                    <TableCell className="hidden md:table-cell">{quote.dateCreated}</TableCell>
                    <TableCell className="hidden lg:table-cell">{quote.expiryDate || "N/A"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                            quote.status === "ACCEPTED" ? "default" : 
                            quote.status === "SENT" ? "secondary" :
                            quote.status === "REJECTED" || quote.status === "CANCELED" ? "destructive" : 
                            "outline"
                        }
                        className={quote.status === "ACCEPTED" ? "bg-green-600 text-white" : ""}
                      >
                        {quote.status}
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
                          <DropdownMenuItem onClick={() => openEditQuoteDialog(quote)}><Eye className="mr-2 h-4 w-4" /> View/Edit Quote</DropdownMenuItem>
                          {/* <DropdownMenuItem onClick={() => openEditQuoteDialog(quote)}><Edit className="mr-2 h-4 w-4" /> Edit Quote</DropdownMenuItem> */}
                          <DropdownMenuItem><Send className="mr-2 h-4 w-4" /> Send Quote</DropdownMenuItem>
                          <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteQuote(quote.id)}>
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
      <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {quotes.length} of {quotes.length} quotes. Pagination controls will be added here.
      </div>
    </div>
  );
}
    
