
"use client";

import React, { useState, useEffect, type FormEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, MoreHorizontal, UserPlus, ShieldCheck, Search, Users as UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// import { supabase } from "@/lib/supabase/client"; // Not directly used for UI demo logic
import { useToast } from "@/hooks/use-toast";

// Types
type Role = {
  id: string;
  name: string;
  description: string;
  // userCount is now derived dynamically
};

type UserInTenant = {
  id: string;
  name: string;
  email: string;
  role: string; // Role name
  avatarUrl?: string;
  dataAiHint?: string;
};

type Permission = {
  id: string;
  category: string;
  name: string;
  description: string;
};

const mockPermissions: Permission[] = [
    { id: "p1", category: "Conversations", name: "View all conversations", description: "Allows viewing conversations across all agents." },
    { id: "p2", category: "Conversations", name: "Assign conversations", description: "Allows assigning conversations to agents." },
    { id: "p3", category: "CRM", name: "Manage leads", description: "Create, edit, and delete leads." },
    { id: "p4", category: "CRM", name: "Manage products", description: "Add or modify product information." },
    { id: "p5", category: "Flow Builder", name: "Create/Edit flows", description: "Design and modify conversational flows." },
    { id: "p6", category: "Analytics", name: "View dashboards", description: "Access to all analytics dashboards." },
    { id: "p7", category: "Settings", name: "Manage users & roles (Tenant)", description: "Control over user accounts and role assignments within the tenant." },
    { id: "p8", category: "Settings", name: "Manage billing", description: "Access billing information and subscription details (Tenant specific)." },
    { id: "p9", category: "Settings", name: "Manage tenant settings", description: "Configure tenant-specific settings." },
];

const initialSystemRoles: Role[] = [
  { id: "role-admin", name: "Administrator", description: "Full access to tenant features and settings." },
  { id: "role-supervisor", name: "Agent Supervisor", description: "Manages agents and reviews conversations within the tenant." },
  { id: "role-agent", name: "Agent", description: "Handles customer conversations within the tenant." },
  { id: "role-analyst", name: "Read-Only Analyst", description: "Views analytics and reports for the tenant." },
];

const initialUsers: UserInTenant[] = [
    { id: "user-1", name: "Admin User", email: "admin@tenant.com", role: "Administrator", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "admin avatar"},
];


export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(initialSystemRoles);
  const [users, setUsers] = useState<UserInTenant[]>(initialUsers);
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles.length > 0 ? roles[0] : null);

  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>(roles.length > 0 ? roles[0].id : "");

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const [isRemoveUserConfirmOpen, setIsRemoveUserConfirmOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<UserInTenant | null>(null);

  const handleInviteUser = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) {
        toast({ title: "Missing Information", description: "Please provide email and role.", variant: "destructive" });
        return;
    }

    const selectedRoleDetails = roles.find(r => r.id === inviteRole);
    if (!selectedRoleDetails) {
        toast({ title: "Invalid Role", description: "Selected role not found.", variant: "destructive" });
        return;
    }

    const newUser: UserInTenant = {
        id: `user-${Date.now()}`,
        name: inviteEmail.split('@')[0] || "New User",
        email: inviteEmail,
        role: selectedRoleDetails.name, // Store role name
        avatarUrl: `https://placehold.co/40x40.png`,
        dataAiHint: "new user avatar"
    };
    setUsers(prev => [...prev, newUser]);

    toast({ title: "Simulated Invitation", description: `User ${inviteEmail} invited as ${selectedRoleDetails.name}. Backend implementation needed.`});
    setInviteEmail("");
    setInviteRole(roles.length > 0 ? roles[0].id : "");
    setIsInviteUserOpen(false);
  };

  const handleAddRole = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast({ title: "Role Name Required", description: "Please enter a name for the new role.", variant: "destructive" });
      return;
    }
    const newRoleToAdd: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      description: newRoleDescription,
    };
    setRoles(prev => [...prev, newRoleToAdd]);
    toast({ title: "Role Added", description: `Role "${newRoleName}" has been added.` });
    setNewRoleName("");
    setNewRoleDescription("");
    setIsAddRoleOpen(false);
  };

  const triggerRemoveUserConfirmation = useCallback((user: UserInTenant) => {
    setUserToRemove(user);
    setIsRemoveUserConfirmOpen(true);
  }, []);

  const confirmRemoveUser = useCallback(() => {
    if (!userToRemove) return;
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userToRemove.id));
    toast({ title: "User Removed (Demo)", description: `User ${userToRemove.email} removed from tenant.` });
    setUserToRemove(null);
    setIsRemoveUserConfirmOpen(false);
  }, [userToRemove, toast, setUsers, setIsRemoveUserConfirmOpen]);

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold flex items-center"><UsersIcon className="mr-3 h-8 w-8 text-primary"/>Users, Roles &amp; Permissions</h1>
            <p className="text-muted-foreground">Manage user access and roles within your tenant.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Invite User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User to Tenant</DialogTitle>
                <DialogDescription>Enter the email address and assign a role for the new user.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input id="inviteEmail" type="email" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="inviteRole">Assign Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="inviteRole">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Send Invitation</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
            <DialogTrigger asChild>
             <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add Role</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Role</DialogTitle>
                    <DialogDescription>Define a new role for users within your tenant.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddRole} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="newRoleName">Role Name</Label>
                        <Input id="newRoleName" placeholder="e.g., Content Editor" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} required/>
                    </div>
                    <div>
                        <Label htmlFor="newRoleDescription">Role Description (Optional)</Label>
                        <Input id="newRoleDescription" placeholder="Briefly describe this role's purpose" value={newRoleDescription} onChange={e => setNewRoleDescription(e.target.value)}/>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Role</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg">Roles ({roles.length})</CardTitle>
            <CardDescription className="text-xs">Roles available in your tenant.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-1">
                {roles.map((role) => (
                    <Button
                      asChild
                      variant={selectedRole?.id === role.id ? "secondary" : "ghost"}
                      key={role.id}
                      className="w-full h-auto p-3 text-left cursor-pointer"
                      onClick={() => setSelectedRole(role)}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                                <span className="font-medium block">{role.name}</span>
                                <span className="text-xs text-muted-foreground block truncate">{role.description}</span>
                                <span className="text-xs text-muted-foreground">
                                    {(users.filter(u => u.role === role.name).length)} users
                                </span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { /* TODO: Open edit role dialog */ setSelectedRole(role);}}><Edit className="mr-2 h-4 w-4" /> Edit Role Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedRole(role)}><ShieldCheck className="mr-2 h-4 w-4" /> Edit Permissions</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </Button>
                ))}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg">Permissions for "{selectedRole?.name || 'No Role Selected'}"</CardTitle>
            <CardDescription className="text-xs">Select permissions for this role.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[calc(300px+2rem)]">
            {selectedRole ? Object.entries(mockPermissions.reduce((acc, p) => {
                acc[p.category] = [...(acc[p.category] || []), p];
                return acc;
            }, {} as Record<string, typeof mockPermissions>)).map(([category, permissionsInCategory]) => (
                <div key={category} className="mb-4">
                    <h3 className="font-semibold text-md mb-2">{category}</h3>
                    <div className="space-y-2">
                    {permissionsInCategory.map(permission => (
                        <div key={permission.id} className="flex items-start p-3 border rounded-md hover:bg-muted/50">
                            <Checkbox id={`perm-${permission.id}`} className="mr-3 mt-1" defaultChecked={Math.random() > 0.5} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor={`perm-${permission.id}`} className="font-medium cursor-pointer">
                                {permission.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                {permission.description}
                                </p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )) : <p className="text-muted-foreground">Select a role to see its permissions.</p>}
            </ScrollArea>
          </CardContent>
          {selectedRole && (
            <CardFooter className="p-4 border-t">
                <Button className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">Save Permissions for "{selectedRole.name}"</Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Users in Tenant ({users.length})</CardTitle>
            <CardDescription className="text-xs">Manage users invited to this tenant and their roles.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found in this tenant. Invite users to get started.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png`} alt={user.name} data-ai-hint={user.dataAiHint || "avatar person"} />
                        <AvatarFallback>{user.name ? user.name.split(" ").map(n=>n[0]).join("") : user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { /* TODO: Open change role dialog */ }}>
                            <Edit className="mr-2 h-4 w-4" /> Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => triggerRemoveUserConfirmation(user)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove from Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={isRemoveUserConfirmOpen} onOpenChange={setIsRemoveUserConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will remove user{" "}
              <strong>{userToRemove?.email || 'this user'}</strong> from the tenant. They will
              lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setUserToRemove(null); setIsRemoveUserConfirmOpen(false);}} type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </ScrollArea>
  );
}
