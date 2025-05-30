
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
import { PlusCircle, FileText, Search, Filter, MoreHorizontal, Edit, Eye, Trash2, Send, Download, CalendarDays } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

// Based on Prisma QuoteStatus enum
const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELED"] as const;
type QuoteStatus = typeof QUOTE_STATUSES[number];

interface Quote {
  id: string;
  quoteNumber: string;
  leadName: string; // Simplified, in reality leadId and fetch lead info
  leadId?: string;
  dateCreated: string;
  expiryDate?: string;
  status: QuoteStatus;
  totalAmount: number;
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
    totalAmount: 1800.50,
  },
  {
    id: "quote-3",
    quoteNumber: "QT-2024-003",
    leadName: "Diana P. (Justice Solutions)",
    leadId: "lead-4",
    dateCreated: "2024-07-15",
    expiryDate: "2024-08-15",
    status: "DRAFT",
    totalAmount: 12000.00,
  },
  {
    id: "quote-4",
    quoteNumber: "QT-2024-004",
    leadName: "Tech Innovations Ltd.", // New lead not in current lead list
    dateCreated: "2024-07-28",
    status: "REJECTED",
    totalAmount: 850.00,
  },
];

export default function CrmQuotesPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotesData);
  const [isAddQuoteDialogOpen, setIsAddQuoteDialogOpen] = useState(false);

  // Form state for adding a new quote
  const [newQuoteLeadName, setNewQuoteLeadName] = useState("");
  const [newQuoteExpiryDate, setNewQuoteExpiryDate] = useState("");
  const [newQuoteStatus, setNewQuoteStatus] = useState<QuoteStatus>("DRAFT");
  const [newQuoteTotalAmount, setNewQuoteTotalAmount] = useState<number | string>("");

  const resetAddQuoteForm = () => {
    setNewQuoteLeadName("");
    setNewQuoteExpiryDate("");
    setNewQuoteStatus("DRAFT");
    setNewQuoteTotalAmount("");
  };

  const handleAddQuoteSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(String(newQuoteTotalAmount));
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid total amount.", variant: "destructive" });
      return;
    }

    const newQuote: Omit<Quote, "id" | "quoteNumber" | "dateCreated"> = {
      leadName: newQuoteLeadName,
      expiryDate: newQuoteExpiryDate || undefined,
      status: newQuoteStatus,
      totalAmount: amount,
    };

    const newQuoteFull: Quote = {
        ...newQuote,
        id: `quote-${Date.now()}`,
        quoteNumber: `QT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
        dateCreated: new Date().toISOString().split('T')[0],
    };
    
    console.log("New Quote Data:", newQuoteFull);
    setQuotes(prevQuotes => [newQuoteFull, ...prevQuotes]);
    toast({ title: "Quote Added (Demo)", description: `Quote for ${newQuote.leadName} has been added.` });
    resetAddQuoteForm();
    setIsAddQuoteDialogOpen(false);
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
        <Dialog open={isAddQuoteDialogOpen} onOpenChange={setIsAddQuoteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddQuoteDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Quote</DialogTitle>
              <DialogDescription>Enter the details for the new sales quote.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddQuoteSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quoteLeadName" className="text-right col-span-1">Lead/Customer</Label>
                  <Input id="quoteLeadName" value={newQuoteLeadName} onChange={(e) => setNewQuoteLeadName(e.target.value)} placeholder="e.g., Acme Corp or John Doe" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quoteExpiryDate" className="text-right col-span-1">Expiry Date</Label>
                  <div className="col-span-3 relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="quoteExpiryDate" type="date" value={newQuoteExpiryDate} onChange={(e) => setNewQuoteExpiryDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quoteStatus" className="text-right col-span-1">Status</Label>
                  <Select value={newQuoteStatus} onValueChange={(value: QuoteStatus) => setNewQuoteStatus(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select quote status" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUOTE_STATUSES.map(status => <SelectItem key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quoteTotalAmount" className="text-right col-span-1">Total Amount ($)</Label>
                  <Input id="quoteTotalAmount" type="number" value={newQuoteTotalAmount} onChange={(e) => setNewQuoteTotalAmount(e.target.value)} placeholder="e.g., 1500.00" className="col-span-3" required step="0.01" min="0"/>
                </div>
                {/* Placeholder for line items - would be a more complex component */}
                <div className="col-span-4 text-sm text-muted-foreground text-center pt-2">
                    Advanced line item editor will be available here.
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetAddQuoteForm}>Cancel</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Quote</Button>
              </DialogFooter>
            </form>
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
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Quote</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Quote</DropdownMenuItem>
                          <DropdownMenuItem><Send className="mr-2 h-4 w-4" /> Send Quote</DropdownMenuItem>
                          <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
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

    