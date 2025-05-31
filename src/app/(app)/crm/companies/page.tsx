
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Building, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Link as LinkIcon, Phone, Mail } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, type FormEvent, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { getCompanies, createCompany, updateCompany } from './actions';

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  description?: string;
  createdAt?: Date; 
  updatedAt?: Date; 
  dataAiHint?: string; 
}

const CompanyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL format (e.g., https://example.com)").optional().or(z.literal('')),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  description: z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof CompanyFormSchema>;


export default function CrmCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [companyToDeleteId, setCompanyToDeleteId] = useState<string | null>(null);
  const [isViewCompanyDialogOpen, setIsViewCompanyDialogOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);

  const addCompanyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(CompanyFormSchema),
    defaultValues: { name: "", email: "", phone: "", website: "", addressStreet: "", addressCity: "", addressState: "", addressPostalCode: "", addressCountry: "", description: "" },
  });

  const editCompanyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(CompanyFormSchema),
  });

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCompanies = await getCompanies();
      setCompanies(fetchedCompanies.map(c => ({...c, dataAiHint: "company office"}))); 
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch companies.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);


  useEffect(() => {
    if (editingCompany) {
      editCompanyForm.reset({
        name: editingCompany.name,
        email: editingCompany.email || "",
        phone: editingCompany.phone || "",
        website: editingCompany.website || "",
        addressStreet: editingCompany.addressStreet || "",
        addressCity: editingCompany.addressCity || "",
        addressState: editingCompany.addressState || "",
        addressPostalCode: editingCompany.addressPostalCode || "",
        addressCountry: editingCompany.addressCountry || "",
        description: editingCompany.description || "",
      });
    }
  }, [editingCompany, editCompanyForm]);

  const handleActualAddCompanySubmit = async (values: CompanyFormValues) => {
    try {
      addCompanyForm.control._formState.isSubmitting = true;
      await createCompany(values);
      toast({ title: "Company Added", description: `${values.name} has been added successfully.` });
      addCompanyForm.reset();
      setIsAddCompanyDialogOpen(false);
      fetchCompanies(); 
    } catch (error: any) {
      toast({ title: "Error Adding Company", description: error.message || "Could not add company.", variant: "destructive" });
    } finally {
       addCompanyForm.control._formState.isSubmitting = false;
    }
  };

  const openEditCompanyDialog = (company: Company) => {
    setEditingCompany(company);
    setIsEditCompanyDialogOpen(true);
  };
  
  const openViewCompanyDialog = (company: Company) => {
    setViewingCompany(company);
    setIsViewCompanyDialogOpen(true);
  };

  const handleActualEditCompanySubmit = async (values: CompanyFormValues) => {
    if (!editingCompany || !editingCompany.id) return;
    try {
      editCompanyForm.control._formState.isSubmitting = true;
      await updateCompany(editingCompany.id, values);
      toast({ title: "Company Updated", description: `${values.name} has been updated successfully.` });
      setIsEditCompanyDialogOpen(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch (error: any) {
       toast({ title: "Error Updating Company", description: error.message || "Could not update company.", variant: "destructive" });
    } finally {
      editCompanyForm.control._formState.isSubmitting = false;
    }
  };
  
  const triggerDeleteConfirmation = (id: string) => {
    setCompanyToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteCompany = () => {
    if (!companyToDeleteId) return;
    // TODO: Call deleteCompany server action
    const companyNameToDelete = companies.find(c => c.id === companyToDeleteId)?.name || "Company";
    setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== companyToDeleteId));
    toast({ title: "Company Deleted", description: `Company "${companyNameToDelete}" has been removed.` });
    setIsDeleteConfirmOpen(false);
    setCompanyToDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Building className="mr-3 h-8 w-8 text-primary"/>Companies</h1>
          <p className="text-muted-foreground">
            Manage company profiles and their associated information.
          </p>
        </div>
        <Dialog open={isAddCompanyDialogOpen} onOpenChange={setIsAddCompanyDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => { addCompanyForm.reset(); setIsAddCompanyDialogOpen(true);}}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>Enter the details for the new company.</DialogDescription>
            </DialogHeader>
            <FormProvider {...addCompanyForm}>
              <form onSubmit={addCompanyForm.handleSubmit(handleActualAddCompanySubmit)}>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                  <FormField control={addCompanyForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={addCompanyForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addCompanyForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 555-1234" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={addCompanyForm.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addCompanyForm.control} name="addressStreet" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Main St" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField control={addCompanyForm.control} name="addressCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Anytown" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addCompanyForm.control} name="addressState" render={({ field }) => (<FormItem><FormLabel>State/Province</FormLabel><FormControl><Input placeholder="CA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addCompanyForm.control} name="addressPostalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="90210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={addCompanyForm.control} name="addressCountry" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="USA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addCompanyForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief description of the company..." {...field} rows={3}/></FormControl><FormMessage /></FormItem>)} />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addCompanyForm.formState.isSubmitting}>
                    {addCompanyForm.formState.isSubmitting ? "Saving..." : "Save Company"}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyDialogOpen} onOpenChange={(isOpen) => { setIsEditCompanyDialogOpen(isOpen); if (!isOpen) setEditingCompany(null); }}>
        <DialogContent className="sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company: {editingCompany?.name}</DialogTitle>
            <DialogDescription>Update the company's details.</DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <FormProvider {...editCompanyForm}>
              <form onSubmit={editCompanyForm.handleSubmit(handleActualEditCompanySubmit)}>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                <div className="grid gap-4 py-4">
                 <FormField control={editCompanyForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={editCompanyForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editCompanyForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={editCompanyForm.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editCompanyForm.control} name="addressStreet" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField control={editCompanyForm.control} name="addressCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editCompanyForm.control} name="addressState" render={({ field }) => (<FormItem><FormLabel>State/Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editCompanyForm.control} name="addressPostalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={editCompanyForm.control} name="addressCountry" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editCompanyForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3}/></FormControl><FormMessage /></FormItem>)} />
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-2">
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={editCompanyForm.formState.isSubmitting}>
                     {editCompanyForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>

      {/* View Company Dialog */}
      <Dialog open={isViewCompanyDialogOpen} onOpenChange={setIsViewCompanyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Company Details: {viewingCompany?.name}</DialogTitle>
          </DialogHeader>
          {viewingCompany && (
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3 py-4 text-sm">
              <div><p className="font-medium text-muted-foreground">Company Name:</p><p>{viewingCompany.name}</p></div>
              {viewingCompany.email && <div><p className="font-medium text-muted-foreground">Email:</p><p className="flex items-center"><Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/>{viewingCompany.email}</p></div>}
              {viewingCompany.phone && <div><p className="font-medium text-muted-foreground">Phone:</p><p className="flex items-center"><Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/>{viewingCompany.phone}</p></div>}
              {viewingCompany.website && <div><p className="font-medium text-muted-foreground">Website:</p><a href={viewingCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center"><LinkIcon className="h-3.5 w-3.5 mr-1.5"/>{viewingCompany.website}</a></div>}
              {(viewingCompany.addressStreet || viewingCompany.addressCity) && (
                <div>
                  <p className="font-medium text-muted-foreground">Address:</p>
                  <p>{viewingCompany.addressStreet}</p>
                  <p>
                    {viewingCompany.addressCity && `${viewingCompany.addressCity}, `}
                    {viewingCompany.addressState && `${viewingCompany.addressState} `}
                    {viewingCompany.addressPostalCode}
                  </p>
                  <p>{viewingCompany.addressCountry}</p>
                </div>
              )}
              {viewingCompany.description && <div><p className="font-medium text-muted-foreground">Description:</p><p className="whitespace-pre-wrap bg-muted/50 p-2 rounded-md">{viewingCompany.description}</p></div>}
            </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete company "{companies.find(c => c.id === companyToDeleteId)?.name || 'this company'}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setCompanyToDeleteId(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCompany} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete Company</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-lg">All Companies ({companies.length})</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search companies..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" />
              </div>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /><span className="sr-only">Filter</span></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {isLoading ? (
                 <div className="text-center py-20 text-muted-foreground">Loading companies...</div>
            ) : companies.length === 0 ? (
                <div className="text-center py-20">
                    <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Companies Found</h3>
                    <p className="text-muted-foreground">Create your first company using the "Add New Company" button.</p>
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Website</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                       <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${company.name[0]}`} alt={company.name} data-ai-hint={company.dataAiHint || "company office"} />
                        <AvatarFallback>{company.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell><div className="font-medium">{company.name}</div></TableCell>
                    <TableCell className="hidden md:table-cell">{company.email || "N/A"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{company.phone || "N/A"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        {company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{company.website}</a> : "N/A"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{company.addressCity || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewCompanyDialog(company)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditCompanyDialog(company)}><Edit className="mr-2 h-4 w-4" /> Edit Company</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerDeleteConfirmation(company.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Company
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
      <div className="text-xs text-muted-foreground text-center flex-shrink-0 py-2">
        Showing {companies.length} of {companies.length} companies. Pagination and advanced filtering controls will be added here.
      </div>
    </div>
  );
}
