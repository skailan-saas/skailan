
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

// Based on Prisma LeadStatus enum
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
  {
    id: "lead-3",
    name: "Charlie B.",
    email: "charlie.b@example.com",
    phone: "555-0103",
    source: "Instagram",
    status: "NEW",
    lastContacted: "2024-07-30",
    dataAiHint: "person face",
  },
  {
    id: "lead-4",
    name: "Diana P.",
    email: "diana.p@example.com",
    source: "Web Chat",
    status: "CONVERTED",
    assignedTo: { name: "John Doe", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "man face", avatarFallback: "JD" },
    lastContacted: "2024-07-25",
    company: "Justice Solutions",
    dataAiHint: "woman avatar",
  },
  {
    id: "lead-5",
    name: "Edward N.",
    email: "edward.n@example.com",
    phone: "555-0105",
    source: "Manual",
    status: "LOST",
    assignedTo: { name: "Jane Smith", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman face", avatarFallback: "JS" },
    lastContacted: "2024-07-15",
    dataAiHint: "man avatar",
  },
];

export default function CrmLeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);

  // Form state for adding a new lead
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>("Manual");
  const [newLeadStatus, setNewLeadStatus] = useState<LeadStatus>("NEW");

  const resetAddLeadForm = () => {
    setNewLeadName("");
    setNewLeadEmail("");
    setNewLeadPhone("");
    setNewLeadCompany("");
    setNewLeadSource("Manual");
    setNewLeadStatus("NEW");
  };

  const handleAddLeadSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newLead: Omit<Lead, "id" | "assignedTo" | "lastContacted" | "dataAiHint"> = {
      name: newLeadName,
      email: newLeadEmail,
      phone: newLeadPhone || undefined,
      company: newLeadCompany || undefined,
      source: newLeadSource,
      status: newLeadStatus,
    };
    // In a real app, you would send this to your backend to create the lead
    console.log("New Lead Data:", newLead); 
    // Add to local state for demo purposes
    setLeads(prevLeads => [...prevLeads, { ...newLead, id: `lead-${Date.now()}`, lastContacted: new Date().toISOString().split('T')[0] }]);
    toast({ title: "Lead Added (Demo)", description: `${newLead.name} has been added to the list.` });
    resetAddLeadForm();
    setIsAddLeadDialogOpen(false);
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
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddLeadDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Enter the details for the new lead.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLeadSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadName" className="text-right col-span-1">Full Name</Label>
                  <Input id="leadName" value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="e.g., John Doe" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadEmail" className="text-right col-span-1">Email</Label>
                  <Input id="leadEmail" type="email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} placeholder="e.g., john@example.com" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadPhone" className="text-right col-span-1">Phone</Label>
                  <Input id="leadPhone" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="e.g., 555-1234" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadCompany" className="text-right col-span-1">Company</Label>
                  <Input id="leadCompany" value={newLeadCompany} onChange={(e) => setNewLeadCompany(e.target.value)} placeholder="e.g., Acme Corp" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadSource" className="text-right col-span-1">Source</Label>
                  <Select value={newLeadSource} onValueChange={(value: LeadSource) => setNewLeadSource(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select lead source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadStatus" className="text-right col-span-1">Status</Label>
                  <Select value={newLeadStatus} onValueChange={(value: LeadStatus) => setNewLeadStatus(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select lead status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetAddLeadForm}>Cancel</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Lead</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${lead.name[0]}`} alt={lead.name} data-ai-hint={lead.dataAiHint || "person avatar"} />
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
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Lead</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                    Create your first lead to get started.
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

    

      