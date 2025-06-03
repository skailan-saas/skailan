"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTemplates, refreshTemplates } from "./actions";

interface WhatsappTemplateComponent {
  type: string;
  text?: string;
  format?: string;
  example?: {
    header_text?: string;
    body_text?: string[];
  };
  buttons?: Array<{
    type: string;
    text: string;
  }>;
}

interface WhatsappTemplate {
  id?: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: WhatsappTemplateComponent[];
}

export default function WhatsappTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTemplates();

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Convertir los datos de la base de datos al tipo esperado
        const convertedTemplates: WhatsappTemplate[] = result.data.map(
          (template) => ({
            ...template,
            components: Array.isArray(template.components)
              ? (template.components as unknown as WhatsappTemplateComponent[])
              : [],
          })
        );
        setTemplates(convertedTemplates);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      setError("Error loading WhatsApp templates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTemplates = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setSuccess(null);

      const result = await refreshTemplates();

      if (result.success) {
        setSuccess(
          `Successfully refreshed ${result.count} templates from WhatsApp API.`
        );
        toast({
          title: "Templates Refreshed",
          description: `Successfully refreshed ${result.count} templates.`,
        });

        // Reload templates to show the updated list
        loadTemplates();
      } else {
        setError(
          result.error ||
            "Failed to refresh templates. Please check your configuration."
        );
        toast({
          title: "Refresh Failed",
          description: result.error || "Failed to refresh templates.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error refreshing templates:", err);
      setError("An error occurred while refreshing templates.");
      toast({
        title: "Error",
        description: "An error occurred while refreshing templates.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (activeTab === "all") return true;
    return template.status.toLowerCase() === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case "marketing":
        return <Badge className="bg-blue-500">Marketing</Badge>;
      case "utility":
        return <Badge className="bg-purple-500">Utility</Badge>;
      case "authentication":
        return <Badge className="bg-indigo-500">Authentication</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const renderTemplateComponents = (
    components: WhatsappTemplateComponent[]
  ) => {
    return components.map((component, index) => {
      if (component.type === "HEADER") {
        return (
          <div key={`header-${index}`} className="mb-2">
            <div className="text-sm font-medium text-muted-foreground">
              Header:
            </div>
            <div className="mt-1 text-base font-medium">
              {component.text || "(Media Header)"}
            </div>
          </div>
        );
      } else if (component.type === "BODY") {
        return (
          <div key={`body-${index}`} className="mb-2">
            <div className="text-sm font-medium text-muted-foreground">
              Body:
            </div>
            <div className="mt-1 whitespace-pre-line">{component.text}</div>
          </div>
        );
      } else if (component.type === "FOOTER") {
        return (
          <div key={`footer-${index}`} className="mb-2">
            <div className="text-sm font-medium text-muted-foreground">
              Footer:
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {component.text}
            </div>
          </div>
        );
      } else if (component.type === "BUTTONS" && component.buttons) {
        return (
          <div key={`buttons-${index}`} className="mb-2">
            <div className="text-sm font-medium text-muted-foreground">
              Buttons:
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {component.buttons.map((button, buttonIndex) => (
                <Badge
                  key={buttonIndex}
                  variant="outline"
                  className="px-3 py-1"
                >
                  {button.text}
                </Badge>
              ))}
            </div>
          </div>
        );
      }
      return null;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            WhatsApp Message Templates
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          WhatsApp Message Templates
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/settings/whatsapp")}
          >
            Back to WhatsApp Config
          </Button>
          <Button onClick={handleRefreshTemplates} disabled={refreshing}>
            {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh Templates
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-700">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {templates.length === 0 && !error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any WhatsApp message templates yet. Templates need
              to be created and approved in the Meta Business Manager first.
            </p>
            <Button onClick={handleRefreshTemplates} disabled={refreshing}>
              {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Templates
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} template
              {filteredTemplates.length !== 1 ? "s" : ""} found
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-[100px]">Language</TableHead>
                      <TableHead className="w-[100px]">Category</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.name}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>
                          <div className="border rounded-md p-3 max-w-md">
                            {renderTemplateComponents(template.components)}
                          </div>
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          {getCategoryBadge(template.category)}
                        </TableCell>
                        <TableCell>{getStatusBadge(template.status)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No templates found with the selected filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-[100px]">Language</TableHead>
                      <TableHead className="w-[100px]">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.name}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>
                          <div className="border rounded-md p-3 max-w-md">
                            {renderTemplateComponents(template.components)}
                          </div>
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          {getCategoryBadge(template.category)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No approved templates found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-[100px]">Language</TableHead>
                      <TableHead className="w-[100px]">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.name}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>
                          <div className="border rounded-md p-3 max-w-md">
                            {renderTemplateComponents(template.components)}
                          </div>
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          {getCategoryBadge(template.category)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No pending templates found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-[100px]">Language</TableHead>
                      <TableHead className="w-[100px]">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.name}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>
                          <div className="border rounded-md p-3 max-w-md">
                            {renderTemplateComponents(template.components)}
                          </div>
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          {getCategoryBadge(template.category)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No rejected templates found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
