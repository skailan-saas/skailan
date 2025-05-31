
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Tag, Building, Mail, Phone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation";
import type { LeadStatus as PrismaLeadStatusType, LeadSource as PrismaLeadSourceType } from '@prisma/client';
import { getLeads, createLead, updateLead, deleteLead, type LeadFE, type LeadFormValues as ServerLeadFormValues } from './actions';

// Enums for form, consistent with Prisma schema but used in client
const LEAD_STATUSES_CLIENT = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CONVERTED", "CLOSED_WON", "CLOSED_LOST", "UNQUALIFIED", "ARCHIVED"] as const;
type LeadStatusClient = typeof LEAD_STATUSES_CLIENT[number];

const LEAD_SOURCES_CLIENT = ["WhatsApp", "WebChat", "Messenger", "Instagram", "Manual", "Referral", "API", "Other"] as const;
type LeadSourceClient = typeof LEAD_SOURCES_CLIENT[number];

const LeadFormSchemaClient = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.enum(LEAD_SOURCES_CLIENT),
  status: z.enum(LEAD_STATUSES_CLIENT),
  tags: z.string().optional(), // Comma-separated string
  notes: z.string().optional(),
  assignedToUserId: z.string().optional(),
});
type LeadFormValuesClient = z.infer<typeof LeadFormSchemaClient>;


export default function CrmLeadsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [leads, setLeads] = useState<LeadFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadFE | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);
  const [isViewLeadDialogOpen, setIsViewLeadDialogOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<LeadFE | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const addLeadForm = useForm<LeadFormValuesClient>({
    resolver: zodResolver(LeadFormSchemaClient),
    defaultValues: { name: "", email: "", phone: "", companyName: "", source: "Manual", status: "NEW", tags: "", notes: "", assignedToUserId: "" },
  });

  const editLeadForm = useForm<LeadFormValuesClient>({
    resolver: zodResolver(LeadFormSchemaClient),
  });

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedLeads = await getLeads();
      setLeads(fetchedLeads.map(l => ({...l, dataAiHint: "person avatar"})));
    } catch (error: any) {
      toast({ title: "Error Fetching Leads", description: error.message || "Could not fetch leads.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch) setSearchTerm(querySearch);
    
    const leadNameToOpen = searchParams.get('viewLeadName');
    if (leadNameToOpen && leads.length > 0) { // Ensure leads are loaded
      const decodedName = decodeURIComponent(leadNameToOpen);
      const leadToView = leads.find(lead => lead.name.toLowerCase() === decodedName.toLowerCase());
      if (leadToView) {
        openViewLeadDialog(leadToView);
      }
    }
  }, [searchParams, leads]);


  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(lowerSearchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.phone && lead.phone.includes(lowerSearchTerm)) ||
      (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
  }, [leads, searchTerm]);

  useEffect(() => {
    if (editingLead) {
      editLeadForm.reset({
        name: editingLead.name,
        email: editingLead.email || "",
        phone: editingLead.phone || "",
        companyName: editingLead.companyName || "",
        source: editingLead.source as LeadSourceClient, // Cast from Prisma type
        status: editingLead.status as LeadStatusClient, // Cast from Prisma type
        tags: editingLead.tags?.join(", ") || "",
        notes: editingLead.notes || "",
        assignedToUserId: editingLead.assignedTo?.id || "",
      });
    }
  }, [editingLead, editLeadForm]);

  const handleActualAddLeadSubmit = async (values: LeadFormValuesClient) => {
    try {
      addLeadForm.control._formState.isSubmitting = true;
      // Cast to ServerLeadFormValues if enums are different, here they map directly for Zod
      await createLead(values as ServerLeadFormValues); 
      toast({ title: "Lead Added", description: `${values.name} has been added.` });
      addLeadForm.reset();
      setIsAddLeadDialogOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error Adding Lead", description: error.message || "Could not add lead.", variant: "destructive" });
    } finally {
       addLeadForm.control._formState.isSubmitting = false;
    }
  };

  const openEditLeadDialog = (lead: LeadFE) => {
    setEditingLead(lead);
    setIsEditLeadDialogOpen(true);
  };
  
  const openViewLeadDialog = (lead: LeadFE) => {
    setViewingLead(lead);
    setIsViewLeadDialogOpen(true);
  };

  const handleActualEditLeadSubmit = async (values: LeadFormValuesClient) => {
    if (!editingLead || !editingLead.id) return;
    try {
      editLeadForm.control._formState.isSubmitting = true;
      await updateLead(editingLead.id, values as ServerLeadFormValues);
      toast({ title: "Lead Updated", description: `${values.name} has been updated.` });
      setIsEditLeadDialogOpen(false);
      setEditingLead(null);
      fetchLeads();
    } catch (error: any) {
       toast({ title: "Error Updating Lead", description: error.message || "Could not update lead.", variant: "destructive" });
    } finally {
      editLeadForm.control._formState.isSubmitting = false;
    }
  };
  
  const triggerDeleteConfirmation = (id: string) => {
    setLeadToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDeleteId) return;
    const leadNameToDelete = leads.find(l => l.id === leadToDeleteId)?.name || "Lead";
    try {
        const result = await deleteLead(leadToDeleteId);
        if (result.success) {
            toast({ title: "Lead Deleted", description: `Lead "${leadNameToDelete}" has been marked as deleted.` });
            fetchLeads(); 
        } else {
            toast({ title: "Error Deleting Lead", description: result.message || "Could not delete lead.", variant: "destructive" });
        }
    } catch (error: any) {
         toast({ title: "Error Deleting Lead", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsDeleteConfirmOpen(false);
    setLeadToDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3 h-8 w-8 text-primary"/>Leads Management</h1>
          <p className="text-muted-foreground">
            View, track, and manage all your customer leads.
          </p>
        </div>
        <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => { addLeadForm.reset(); setIsAddLeadDialogOpen(true);}}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Enter the details for the new lead.</DialogDescription>
            </DialogHeader>
            <FormProvider {...addLeadForm}>
              <form onSubmit={addLeadForm.handleSubmit(handleActualAddLeadSubmit)}>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addLeadForm.control} name="name" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Full Name *</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., John Doe" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="email" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Email</FormLabel><FormControl className="col-span-3"><Input type="email" placeholder="e.g., john@example.com" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="phone" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Phone</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., 555-1234" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="companyName" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Company</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., Acme Corp" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="source" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select lead source" /></SelectTrigger></FormControl><SelectContent>{LEAD_SOURCES_CLIENT.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue placeholder="Select lead status" /></SelectTrigger></FormControl><SelectContent>{LEAD_STATUSES_CLIENT.map(status => <SelectItem key={status} value={status}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="tags" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Tags</FormLabel><FormControl className="col-span-3"><Input placeholder="e.g., vip, referral" {...field} /></FormControl></div><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={addLeadForm.control} name="notes" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Notes</FormLabel><FormControl className="col-span-3"><Textarea placeholder="Add any relevant notes..." {...field} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  {/* Add assignedToUserId select here if needed */}
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addLeadForm.formState.isSubmitting}>
                    {addLeadForm.formState.isSubmitting ? "Saving..." : "Save Lead"}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditLeadDialogOpen} onOpenChange={(isOpen) => { setIsEditLeadDialogOpen(isOpen); if (!isOpen) setEditingLead(null); }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Lead: {editingLead?.name}</DialogTitle>
            <DialogDescription>Update the details for this lead.</DialogDescription>
          </DialogHeader>
          {editingLead && (
            <FormProvider {...editLeadForm}>
              <form onSubmit={editLeadForm.handleSubmit(handleActualEditLeadSubmit)}>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={editLeadForm.control} name="name" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Full Name *</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="email" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Email</FormLabel><FormControl className="col-span-3"><Input type="email" {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="phone" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Phone</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="companyName" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Company</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="source" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Source</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{LEAD_SOURCES_CLIENT.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="status" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl className="col-span-3"><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{LEAD_STATUSES_CLIENT.map(status => <SelectItem key={status} value={status}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="tags" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-center gap-4"><FormLabel className="text-right col-span-1">Tags</FormLabel><FormControl className="col-span-3"><Input {...field} /></FormControl></div><p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated tags.</p><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                  <FormField control={editLeadForm.control} name="notes" render={({ field }) => (<FormItem><div className="grid grid-cols-4 items-start gap-4"><FormLabel className="text-right col-span-1 pt-2">Notes</FormLabel><FormControl className="col-span-3"><Textarea {...field} rows={3}/></FormControl></div><FormMessage className="col-start-2 col-span-3" /></FormItem>)} />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editLeadForm.formState.isSubmitting}>
                    {editLeadForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewLeadDialogOpen} onOpenChange={setIsViewLeadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Lead Details: {viewingLead?.name}</DialogTitle></DialogHeader>
          {viewingLead && (
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3 py-4 text-sm">
              <div><p className="font-medium text-muted-foreground">Full Name:</p><p>{viewingLead.name}</p></div>
              {viewingLead.email && <div><p className="font-medium text-muted-foreground">Email:</p><p className="flex items-center"><Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/>{viewingLead.email}</p></div>}
              {viewingLead.phone && <div><p className="font-medium text-muted-foreground">Phone:</p><p className="flex items-center"><Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/>{viewingLead.phone}</p></div>}
              {viewingLead.companyName && <div><p className="font-medium text-muted-foreground">Company:</p><p className="flex items-center"><Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/>{viewingLead.companyName}</p></div>}
              <div><p className="font-medium text-muted-foreground">Source:</p><div><Badge variant="outline">{viewingLead.source}</Badge></div></div>
              <div><p className="font-medium text-muted-foreground">Status:</p><div><Badge variant={viewingLead.status === "CONVERTED" || viewingLead.status === "CLOSED_WON" ? "default" : viewingLead.status === "QUALIFIED" ? "secondary" : viewingLead.status === "CLOSED_LOST" || viewingLead.status === "UNQUALIFIED" ? "destructive" : "outline"} className={viewingLead.status === "CONVERTED" || viewingLead.status === "CLOSED_WON" ? "bg-green-600 text-white" : ""}>{String(viewingLead.status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge></div></div>
              {viewingLead.assignedTo?.name && (<div><p className="font-medium text-muted-foreground">Assigned To:</p><p>{viewingLead.assignedTo.name}</p></div>)}
              {viewingLead.lastContacted && (<div><p className="font-medium text-muted-foreground">Last Contacted:</p><p>{new Date(viewingLead.lastContacted).toLocaleDateString()}</p></div>)}
              {viewingLead.tags && viewingLead.tags.length > 0 && (<div><p className="font-medium text-muted-foreground">Tags:</p><div className="flex flex-wrap gap-1 mt-1">{viewingLead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs"><Tag className="h-3 w-3 mr-1"/>{tag}</Badge>)}</div></div>)}
              {viewingLead.notes && (<div><p className="font-medium text-muted-foreground">Notes:</p><p className="whitespace-pre-wrap bg-muted/50 p-2 rounded-md">{viewingLead.notes}</p></div>)}
              {viewingLead.createdAt && (<div><p className="font-medium text-muted-foreground">Created At:</p><p>{new Date(viewingLead.createdAt).toLocaleString()}</p></div>)}
            </div>
            </ScrollArea>
          )}
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will mark lead "{leads.find(l => l.id === leadToDeleteId)?.name || 'this lead'}" as deleted. It can be recovered by an administrator.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => {setLeadToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteLead} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete Lead</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4"><div className="flex flex-col sm:flex-row justify-between items-center gap-2"><CardTitle className="text-lg">All Leads ({filteredLeads.length})</CardTitle><div className="flex items-center gap-2 w-full sm:w-auto"><div className="relative flex-1 sm:flex-initial"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search leads..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><Button variant="outline" size="icon"><Filter className="h-4 w-4" /><span className="sr-only">Filter</span></Button></div></div></CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {isLoading ? (<div className="text-center py-20 text-muted-foreground">Loading leads...</div>) : 
            filteredLeads.length === 0 ? (
                <div className="text-center py-20"><Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold text-foreground">No Leads Found</h3><p className="text-muted-foreground">{searchTerm ? "Try adjusting your search term." : "Create your first lead using the 'Add New Lead' button."}</p></div>
            ) : (
            <Table>
              <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Name &amp; Company</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead className="hidden lg:table-cell">Phone</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Tags</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell><Avatar className="h-9 w-9"><AvatarImage src={`https://placehold.co/40x40.png?text=${lead.name[0]}`} alt={lead.name} data-ai-hint={lead.dataAiHint || "avatar person"} /><AvatarFallback>{lead.name.substring(0,2).toUpperCase()}</AvatarFallback></Avatar></TableCell>
                    <TableCell><div className="font-medium">{lead.name}</div><div className="text-xs text-muted-foreground">{lead.companyName || "N/A"}</div></TableCell>
                    <TableCell className="hidden md:table-cell">{lead.email || "N/A"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.phone || "N/A"}</TableCell>
                    <TableCell><Badge variant="outline">{String(lead.source)}</Badge></TableCell>
                    <TableCell><Badge variant={lead.status === "CONVERTED" || lead.status === "CLOSED_WON" ? "default" : lead.status === "QUALIFIED" ? "secondary" : lead.status === "CLOSED_LOST" || lead.status === "UNQUALIFIED" ? "destructive" : "outline"} className={lead.status === "CONVERTED" || lead.status === "CLOSED_WON" ? "bg-green-600 text-white" : ""}>{String(lead.status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="flex flex-wrap gap-1">{lead.tags?.slice(0,2).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}{lead.tags && lead.tags.length > 2 && <Badge variant="outline" className="text-xs">+{lead.tags.length - 2}</Badge>}{(!lead.tags || lead.tags.length === 0) && <span className="text-xs text-muted-foreground">No tags</span>}</div></TableCell>
                    <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openViewLeadDialog(lead)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem><DropdownMenuItem onClick={() => openEditLeadDialog(lead)}><Edit className="mr-2 h-4 w-4" /> Edit Lead</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerDeleteConfirmation(lead.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Lead</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">Showing {filteredLeads.length} of {leads.length} leads. Pagination and advanced filtering controls will be added here.</div>
    </div>
  );
}
