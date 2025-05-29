
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, MoreHorizontal, UserPlus, ShieldCheck, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockRoles = [
  { id: "1", name: "Administrator", description: "Full access to all features and settings.", userCount: 2 },
  { id: "2", name: "Agent Supervisor", description: "Manages agents and reviews conversations.", userCount: 5 },
  { id: "3", name: "Agent", description: "Handles customer conversations.", userCount: 25 },
  { id: "4", name: "Read-Only Analyst", description: "Views analytics and reports only.", userCount: 3 },
];

const mockUsers = [
  { id: "u1", name: "Alice Johnson", email: "alice@example.com", role: "Administrator", avatar: "https://placehold.co/40x40.png", dataAiHint:"female avatar" },
  { id: "u2", name: "Bob Williams", email: "bob@example.com", role: "Agent Supervisor", avatar: "https://placehold.co/40x40.png", dataAiHint:"male avatar" },
  { id: "u3", name: "Carol Davis", email: "carol@example.com", role: "Agent", avatar: "https://placehold.co/40x40.png", dataAiHint:"person avatar" },
  { id: "u4", name: "David Miller", email: "david@example.com", role: "Agent", avatar: "https://placehold.co/40x40.png", dataAiHint:"man face" },
];

const mockPermissions = [
    { id: "p1", category: "Conversations", name: "View all conversations", description: "Allows viewing conversations across all agents." },
    { id: "p2", category: "Conversations", name: "Assign conversations", description: "Allows assigning conversations to agents." },
    { id: "p3", category: "CRM", name: "Manage leads", description: "Create, edit, and delete leads." },
    { id: "p4", category: "CRM", name: "Manage products", description: "Add or modify product information." },
    { id: "p5", category: "Flow Builder", name: "Create/Edit flows", description: "Design and modify conversational flows." },
    { id: "p6", category: "Analytics", name: "View dashboards", description: "Access to all analytics dashboards." },
    { id: "p7", category: "Settings", name: "Manage users & roles", description: "Full control over user accounts and role permissions." },
    { id: "p8", category: "Settings", name: "Manage billing", description: "Access billing information and subscription details." },
];


export default function RolesPage() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">Manage user roles and their access levels within Conecta Hub.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Invite User</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add Role</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List Card */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg">Roles</CardTitle>
            <CardDescription className="text-xs">Define access levels for users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-1">
                {mockRoles.map((role) => (
                    <Button asChild variant="ghost" key={role.id} className="w-full h-auto p-3 text-left cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                                <span className="font-medium block">{role.name}</span>
                                <span className="text-xs text-muted-foreground block truncate">{role.description}</span>
                                <span className="text-xs text-muted-foreground">{role.userCount} users</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Role</DropdownMenuItem>
                                    <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" /> Edit Permissions</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete Role</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </Button>
                ))}
                </div>
            </ScrollArea>
          </CardContent>
           <CardFooter className="p-2 border-t">
            <Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add New Role</Button>
          </CardFooter>
        </Card>

        {/* Permissions Editor Card (Example for a selected role) */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg">Permissions for "Administrator"</CardTitle>
            <CardDescription className="text-xs">Select permissions for this role.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[calc(300px+2rem)]"> {/* Adjust height to match roles card content area */}
            {Object.entries(mockPermissions.reduce((acc, p) => {
                acc[p.category] = [...(acc[p.category] || []), p];
                return acc;
            }, {} as Record<string, typeof mockPermissions>)).map(([category, permissions]) => (
                <div key={category} className="mb-4">
                    <h3 className="font-semibold text-md mb-2">{category}</h3>
                    <div className="space-y-2">
                    {permissions.map(permission => (
                        <div key={permission.id} className="flex items-start p-3 border rounded-md hover:bg-muted/50">
                            <Checkbox id={permission.id} className="mr-3 mt-1" defaultChecked={category === "Settings" || category === "Conversations"} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor={permission.id} className="font-medium cursor-pointer">
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
            ))}
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <Button className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">Save Permissions</Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Users Table Card */}
      <Card className="shadow-lg">
        <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription className="text-xs">Manage user accounts and assign roles.</CardDescription>
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
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint={user.dataAiHint} />
                        <AvatarFallback>{user.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit User</DropdownMenuItem>
                        <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" /> Change Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete User</DropdownMenuItem>
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
    </div>
    </ScrollArea>
  );
}
