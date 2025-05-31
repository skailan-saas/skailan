
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Building, Palette, KeyRound, Upload, PlusCircle, Trash2, Copy } from "lucide-react";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

const mockApiKeys: ApiKey[] = [
  { id: "key_1", name: "Default Integration Key", prefix: "ch_live_abc...", createdAt: "2024-01-15", lastUsedAt: "2024-07-20" },
  { id: "key_2", name: "Marketing Automation Key", prefix: "ch_live_xyz...", createdAt: "2024-05-10", expiresAt: "2025-05-10" },
];

export default function TenantSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Tenant Details
  const [tenantName, setTenantName] = useState("My Conecta Hub Tenant"); // Mock data
  
  // Appearance
  const [logoUrl, setLogoUrl] = useState("https://placehold.co/150x50.png?text=Tenant+Logo"); // Mock data
  const [logoPreview, setLogoPreview] = useState(logoUrl);
  const [primaryColor, setPrimaryColor] = useState("#29ABE2"); // Default theme color
  const [secondaryColor, setSecondaryColor] = useState("#80E140"); // Default theme accent

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [showFullApiKey, setShowFullApiKey] = useState<string | null>(null); // For displaying newly generated key
  const [keyToRemove, setKeyToRemove] = useState<ApiKey | null>(null);

  const handleTenantDetailsUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Tenant Details Updated", description: `Name set to: ${tenantName}` });
      setLoading(false);
    }, 1000);
  };

  const handleAppearanceUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLogoPreview(logoUrl); // Update preview on save
      toast({ title: "Appearance Updated", description: "Logo and color preferences saved." });
      // Here you would also trigger a theme update if colors change
      // document.documentElement.style.setProperty('--primary', primaryColor); // Simplified example
      setLoading(false);
    }, 1000);
  };

  const handleGenerateApiKey = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newApiKeyName.trim()) {
        toast({title: "API Key Name Required", variant: "destructive"});
        return;
    }
    setLoading(true);
    // Simulate API call and key generation
    setTimeout(() => {
      const newKeyId = `key_${Date.now()}`;
      const fullKey = `ch_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const newKey: ApiKey = {
        id: newKeyId,
        name: newApiKeyName,
        prefix: `${fullKey.substring(0, 10)}...`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setApiKeys(prev => [newKey, ...prev]);
      setShowFullApiKey(fullKey); // Show the full key temporarily
      setNewApiKeyName("");
      toast({ title: "API Key Generated", description: `Key "${newKey.name}" created. Make sure to copy it now.` });
      setLoading(false);
    }, 1000);
  };
  
  const confirmRemoveApiKey = () => {
    if (!keyToRemove) return;
    setApiKeys(prev => prev.filter(key => key.id !== keyToRemove.id));
    toast({ title: "API Key Revoked", description: `Key "${keyToRemove.name}" has been revoked.` });
    setKeyToRemove(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard!" });
    }).catch(err => {
      toast({ title: "Failed to copy", description: err.message, variant: "destructive" });
    });
  };


  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold flex items-center"><Building className="mr-3 h-8 w-8 text-primary"/>Tenant Settings</h1>
            <p className="text-muted-foreground">Manage your organization's settings, appearance, and API access.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Tenant Details</CardTitle>
          <CardDescription>Update your organization's basic information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTenantDetailsUpdate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input 
                id="tenantName" 
                type="text" 
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Your Organization's Name"
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tenantSubdomain">Subdomain</Label>
              <Input 
                id="tenantSubdomain" 
                type="text" 
                value="my-tenant" // Mock data
                readOnly 
                disabled
                className="bg-muted/50"
              />
               <p className="text-xs text-muted-foreground">Your unique subdomain (e.g., my-tenant.conectahub.app). Cannot be changed.</p>
            </div>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? "Saving..." : "Save Tenant Details"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5"/>Appearance</CardTitle>
          <CardDescription>Customize the look and feel for your tenant (feature in development).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAppearanceUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="logoUrl" 
                  type="url" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={loading}
                />
                {/* <Button type="button" variant="outline" size="icon" disabled={loading}><Upload className="h-4 w-4"/></Button> */}
              </div>
              {logoPreview && (
                <div className="mt-2 p-2 border rounded-md inline-block bg-muted">
                    <Image src={logoPreview} alt="Logo Preview" width={150} height={50} style={{objectFit: 'contain', maxHeight: '50px', maxWidth: '150px'}} data-ai-hint="company logo" />
                </div>
              )}
               <p className="text-xs text-muted-foreground">Enter the URL of your company logo.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        id="primaryColorInput" 
                        type="text" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#RRGGBB"
                        className="w-24"
                        disabled={loading}
                    />
                    <Input 
                        id="primaryColorPicker" 
                        type="color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-10 p-1"
                        disabled={loading}
                    />
                </div>
                </div>
                <div className="space-y-1">
                <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
                 <div className="flex items-center gap-2">
                    <Input 
                        id="secondaryColorInput" 
                        type="text" 
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#RRGGBB"
                        className="w-24"
                        disabled={loading}
                    />
                    <Input 
                        id="secondaryColorPicker" 
                        type="color" 
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-10 p-1"
                        disabled={loading}
                    />
                </div>
                </div>
            </div>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? "Saving..." : "Save Appearance Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5"/>API Keys</CardTitle>
          <CardDescription>Manage API keys for programmatic access to your tenant data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <form onSubmit={handleGenerateApiKey} className="flex items-end gap-2">
                <div className="flex-grow space-y-1">
                    <Label htmlFor="newApiKeyName">New API Key Name</Label>
                    <Input 
                        id="newApiKeyName"
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        placeholder="e.g., External CRM Sync"
                        disabled={loading}
                    />
                </div>
                <Button type="submit" disabled={loading || !newApiKeyName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <PlusCircle className="mr-2 h-4 w-4"/> {loading ? "Generating..." : "Generate Key"}
                </Button>
            </form>

            {showFullApiKey && (
                <AlertDialog defaultOpen onOpenChange={(open) => !open && setShowFullApiKey(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>New API Key Generated!</AlertDialogTitle>
                            <AlertDialogDescription>
                                This is the only time your full API key will be shown. Please copy it and store it securely.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="p-2 bg-muted rounded-md font-mono text-sm break-all relative">
                            {showFullApiKey}
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => copyToClipboard(showFullApiKey)}>
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => setShowFullApiKey(null)}>I have copied the key</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <h4 className="text-md font-medium pt-4">Existing API Keys</h4>
            {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API keys generated yet.</p>
            ) : (
            <ScrollArea className="h-[200px] border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Key Prefix</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead>Expires At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apiKeys.map(key => (
                            <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.name}</TableCell>
                                <TableCell className="font-mono text-xs">{key.prefix}</TableCell>
                                <TableCell>{key.createdAt}</TableCell>
                                <TableCell>{key.lastUsedAt || "Never"}</TableCell>
                                <TableCell>{key.expiresAt || "Never"}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => setKeyToRemove(key)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </ScrollArea>
            )}
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog for API Key Removal */}
      {keyToRemove && (
        <AlertDialog open={!!keyToRemove} onOpenChange={(open) => !open && setKeyToRemove(null)}>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to revoke this API key?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Any applications using the key "{keyToRemove.name}" will lose access.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setKeyToRemove(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmRemoveApiKey} className="bg-destructive hover:bg-destructive/90">Revoke Key</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
    </ScrollArea>
  );
}
