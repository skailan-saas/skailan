
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "UNQUALIFIED"] as const;
type LeadStatus = typeof LEAD_STATUSES[number];
const LEAD_SOURCES = ["WhatsApp", "Web Chat", "Messenger", "Instagram", "Manual", "Referral"] as const;
type LeadSource = typeof LEAD_SOURCES[number];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo?: { name: string; avatarUrl: string; avatarFallback: string; dataAiHint?: string };
  lastContacted?: string;
  company?: string;
  dataAiHint?: string;
}

const LeadFormSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(LEAD_SOURCES),
  status: z.enum(LEAD_STATUSES),
});
type LeadFormValues = z.infer<typeof LeadFormSchema>;


const initialLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Alice W.",
    email: "alice.w@example.com",
    phone: "555-0101",
    source: "WhatsApp",
    status: "QUALIFIED",
    assignedTo: { name: "John Doe", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "man face", avatarFallback: "JD" },
    lastContacted: "2024-07-28",
    company: "Wonderland Inc.",
    dataAiHint: "female face",
  },
  {
    id: "lead-2",
    name: "Bob T.",
    email: "bob.t@example.com",
    source: "Messenger",
    status: "CONTACTED",
    assignedTo: { name: "Jane Smith", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", avatarFallback: "JS" },
    lastContacted: "2024-07-29",
    company: "Builders Co.",
    dataAiHint: "male face",
  },
];

export default function CrmLeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);
  const [isViewLeadDialogOpen, setIsViewLeadDialogOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);


  const addLeadForm = useForm<LeadFormValues>({
    resolver: zodResolver(LeadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "Manual",
      status: "NEW",
    },
  });

  const editLeadForm = useForm<LeadFormValues>({
    resolver: zodResolver(LeadFormSchema),
  });

  useEffect(() => {
    if (editingLead) {
      editLeadForm.reset({
        name: editingLead.name,
        email: editingLead.email,
        phone: editingLead.phone || "",
        company: editingLead.company || "",
        source: editingLead.source,
        status: editingLead.status,
      });
    }
  }, [editingLead, editLeadForm]);

  const handleActualAddLeadSubmit = (values: LeadFormValues) => {
    const newLeadToAdd: Lead = {
      id: `lead-${Date.now()}`,
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      company: values.company || undefined,
      source: values.source,
      status: values.status,
      lastContacted: new Date().toISOString().split('T')[0],
      dataAiHint: "person avatar" 
    };
    setLeads(prevLeads => [newLeadToAdd, ...prevLeads]);
    toast({ title: "Lead Added", description: `${newLeadToAdd.name} has been added.` });
    addLeadForm.reset();
    setIsAddLeadDialogOpen(false);
  };

  const openEditLeadDialog = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditLeadDialogOpen(true);
  };
  
  const openViewLeadDialog = (lead: Lead) => {
    setViewingLead(lead);
    setIsViewLeadDialogOpen(true);
  };

  const handleActualEditLeadSubmit = (values: LeadFormValues) => {
    if (!editingLead) return;

    const updatedLead: Lead = {
      ...editingLead,
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      company: values.company || undefined,
      source: values.source,
      status: values.status,
      lastContacted: new Date().toISOString().split('T')[0], // Or preserve original lastContacted based on logic
    };

    setLeads(prevLeads => prevLeads.map(l => l.id === editingLead.id ? updatedLead : l));
    toast({ title: "Lead Updated", description: `${updatedLead.name} has been updated.` });
    setIsEditLeadDialogOpen(false);
    setEditingLead(null);
  };
  
  const triggerDeleteConfirmation = (id: string) => {
    setLeadToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteLead = () => {
    if (!leadToDeleteId) return;
    const leadNameToDelete = leads.find(l => l.id === leadToDeleteId)?.name || "Lead";
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadToDeleteId));
    toast({ title: "Lead Deleted", description: `Lead "${leadNameToDelete}" has been removed.` });
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
                  <FormField
                    control={addLeadForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Full Name</FormLabel>
                          <FormControl className="col-span-3">
                            <Input placeholder="e.g., John Doe" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={addLeadForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Email</FormLabel>
                          <FormControl className="col-span-3">
                            <Input type="email" placeholder="e.g., john@example.com" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addLeadForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Phone</FormLabel>
                          <FormControl className="col-span-3">
                            <Input placeholder="e.g., 555-1234" {...field} />
                          </FormControl>
                        </div>
                         <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addLeadForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Company</FormLabel>
                          <FormControl className="col-span-3">
                            <Input placeholder="e.g., Acme Corp" {...field} />
                          </FormControl>
                        </div>
                         <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addLeadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Source</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl className="col-span-3">
                              <SelectTrigger><SelectValue placeholder="Select lead source" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_SOURCES.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addLeadForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl className="col-span-3">
                              <SelectTrigger><SelectValue placeholder="Select lead status" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsAddLeadDialogOpen(false)}>Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addLeadForm.formState.isSubmitting}>Save Lead</Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadDialogOpen} onOpenChange={(isOpen) => {
        setIsEditLeadDialogOpen(isOpen);
        if (!isOpen) setEditingLead(null);
      }}>
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
                  <FormField
                    control={editLeadForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Full Name</FormLabel>
                          <FormControl className="col-span-3"><Input {...field} /></FormControl>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={editLeadForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Email</FormLabel>
                          <FormControl className="col-span-3"><Input type="email" {...field} /></FormControl>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={editLeadForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Phone</FormLabel>
                          <FormControl className="col-span-3"><Input {...field} /></FormControl>
                        </div>
                         <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Company</FormLabel>
                          <FormControl className="col-span-3"><Input {...field} /></FormControl>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Source</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl className="col-span-3">
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_SOURCES.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right col-span-1">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl className="col-span-3">
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsEditLeadDialogOpen(false)}>Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editLeadForm.formState.isSubmitting}>Save Changes</Button>
                </DialogFooter>
              </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={isViewLeadDialogOpen} onOpenChange={setIsViewLeadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details: {viewingLead?.name}</DialogTitle>
            <DialogDescription>Read-only view of the lead's information.</DialogDescription>
          </DialogHeader>
          {viewingLead && (
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3 py-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Full Name:</p>
                <p>{viewingLead.name}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Email:</p>
                <p>{viewingLead.email}</p>
              </div>
              {viewingLead.phone && (
                <div>
                  <p className="font-medium text-muted-foreground">Phone:</p>
                  <p>{viewingLead.phone}</p>
                </div>
              )}
              {viewingLead.company && (
                <div>
                  <p className="font-medium text-muted-foreground">Company:</p>
                  <p>{viewingLead.company}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Source:</p>
                <p><Badge variant="outline">{viewingLead.source}</Badge></p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Status:</p>
                <p>
                  <Badge 
                    variant={viewingLead.status === "CONVERTED" ? "default" : viewingLead.status === "QUALIFIED" ? "secondary" : viewingLead.status === "LOST" ? "destructive" : "outline"}
                    className={viewingLead.status === "CONVERTED" ? "bg-green-600 text-white" : ""}
                  >
                    {viewingLead.status}
                  </Badge>
                </p>
              </div>
              {viewingLead.assignedTo && (
                 <div>
                  <p className="font-medium text-muted-foreground">Assigned To:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={viewingLead.assignedTo.avatarUrl} alt={viewingLead.assignedTo.name} data-ai-hint={viewingLead.assignedTo.dataAiHint || "avatar person"} />
                      <AvatarFallback>{viewingLead.assignedTo.avatarFallback}</AvatarFallback>
                    </Avatar>
                    <span>{viewingLead.assignedTo.name}</span>
                  </div>
                </div>
              )}
              {viewingLead.lastContacted && (
                <div>
                  <p className="font-medium text-muted-foreground">Last Contacted:</p>
                  <p>{viewingLead.lastContacted}</p>
                </div>
              )}
            </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete lead "{leads.find(l => l.id === leadToDeleteId)?.name || 'this lead'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setLeadToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLead} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-lg">All Leads ({leads.length})</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search leads..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" />
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
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Contacted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                       <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${lead.name[0]}`} alt={lead.name} data-ai-hint={lead.dataAiHint || "avatar person"} />
                        <AvatarFallback>{lead.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{lead.company}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={lead.status === "CONVERTED" ? "default" : lead.status === "QUALIFIED" ? "secondary" : lead.status === "LOST" ? "destructive" : "outline"}
                        className={lead.status === "CONVERTED" ? "bg-green-600 text-white" : ""}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={lead.assignedTo.avatarUrl} alt={lead.assignedTo.name} data-ai-hint={lead.assignedTo.dataAiHint || "avatar person"} />
                            <AvatarFallback>{lead.assignedTo.avatarFallback}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{lead.assignedTo.name}</span>
                        </div>
                      ) : "Unassigned"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.lastContacted || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewLeadDialog(lead)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditLeadDialog(lead)}><Edit className="mr-2 h-4 w-4" /> Edit Lead</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerDeleteConfirmation(lead.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {leads.length === 0 && (
                <div className="text-center py-20">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Leads Found</h3>
                    <p className="text-muted-foreground">
                    Create your first lead using the "Add New Lead" button.
                    </p>
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {leads.length} of {leads.length} leads. Pagination and advanced filtering controls will be added here.
      </div>
    </div>
  );
}


    