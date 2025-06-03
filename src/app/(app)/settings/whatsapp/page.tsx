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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getWhatsappConfig,
  saveWhatsappConfig,
  testWhatsappConnection,
  refreshTemplates,
} from "./actions";
import type { WhatsappConfigFormData } from "./types";

export default function WhatsappConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<WhatsappConfigFormData>({
    id: "",
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    webhookVerifyToken: "",
    displayPhoneNumber: "",
    isActive: true,
    businessName: "",
    businessDescription: "",
    businessWebsite: "",
    businessEmail: "",
    businessAddress: "",
    businessVertical: "",
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        setError(null);
        const config = await getWhatsappConfig();

        if (config) {
          setFormData({
            id: config.id || "",
            phoneNumberId: config.phoneNumberId || "",
            businessAccountId: config.businessAccountId || "",
            accessToken: config.accessToken || "",
            webhookVerifyToken: config.webhookVerifyToken || "",
            displayPhoneNumber: config.displayPhoneNumber || "",
            isActive: config.isActive,
            businessName: config.businessName || "",
            businessDescription: config.businessDescription || "",
            businessWebsite: config.businessWebsite || "",
            businessEmail: config.businessEmail || "",
            businessAddress: config.businessAddress || "",
            businessVertical: config.businessVertical || "",
          });
        } else {
          // Generate a random webhook verify token if none exists
          const randomToken =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
          setFormData({
            ...formData,
            webhookVerifyToken: randomToken,
          });
        }
      } catch (err) {
        console.error("Error loading WhatsApp config:", err);
        setError("Error loading WhatsApp configuration. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: WhatsappConfigFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev: WhatsappConfigFormData) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const result = await saveWhatsappConfig(formData);

      if (result.error) {
        setError(result.error);
        toast({
          title: "Error Saving Configuration",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccess("WhatsApp configuration saved successfully!");
        toast({
          title: "Configuration Saved",
          description:
            "WhatsApp Business API configuration has been saved successfully.",
        });

        // Update form with any returned data
        if (result.data) {
          setFormData((prev: WhatsappConfigFormData) => ({
            ...prev,
            id: result.data.id || prev.id,
          }));
        }
      }
    } catch (err) {
      console.error("Error saving WhatsApp config:", err);
      setError("An unexpected error occurred while saving. Please try again.");
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await testWhatsappConnection(formData);

      if (result.success) {
        setSuccess(
          result.message ||
            "Connection successful! Your WhatsApp Business API is properly configured."
        );
        toast({
          title: "Connection Successful",
          description:
            result.message ||
            "Your WhatsApp Business API is properly configured.",
        });
      } else {
        setError(
          result.error ||
            "Connection test failed. Please check your configuration."
        );
        toast({
          title: "Connection Failed",
          description:
            result.error || "Please check your WhatsApp configuration.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error testing WhatsApp connection:", err);
      setError(
        "An error occurred while testing the connection. Please try again."
      );
      toast({
        title: "Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRefreshTemplates = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await refreshTemplates();

      if (result.success) {
        setSuccess("Message templates refreshed successfully!");
        toast({
          title: "Templates Refreshed",
          description: `Successfully refreshed ${result.count} message templates.`,
        });
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
      setError(
        "An error occurred while refreshing templates. Please try again."
      );
      toast({
        title: "Error",
        description: "An error occurred while refreshing templates.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading WhatsApp configuration...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          WhatsApp Business API Configuration
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/settings")}>
            Back to Settings
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/settings/whatsapp/templates")}
          >
            Message Templates
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure your WhatsApp Business API credentials from Meta
              Business Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  name="phoneNumberId"
                  placeholder="Enter your WhatsApp Phone Number ID"
                  value={formData.phoneNumberId}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Found in the Meta Business Dashboard under WhatsApp &gt; API
                  Setup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  name="businessAccountId"
                  placeholder="Enter your Meta Business Account ID"
                  value={formData.businessAccountId}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The ID of your Facebook Business Account
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Permanent Access Token</Label>
              <Input
                id="accessToken"
                name="accessToken"
                type="password"
                placeholder="Enter your WhatsApp permanent access token"
                value={formData.accessToken}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Generate a permanent access token in the Meta Business Dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayPhoneNumber">Display Phone Number</Label>
                <Input
                  id="displayPhoneNumber"
                  name="displayPhoneNumber"
                  placeholder="+1234567890"
                  value={formData.displayPhoneNumber}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The phone number with country code (for display purposes)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
                <Input
                  id="webhookVerifyToken"
                  name="webhookVerifyToken"
                  value={formData.webhookVerifyToken}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Custom token for webhook verification
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Information about your business that will be displayed to
              customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="Your Company Name"
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessVertical">Business Category</Label>
                <Input
                  id="businessVertical"
                  name="businessVertical"
                  placeholder="e.g., RETAIL, EDUCATION, HEALTH"
                  value={formData.businessVertical}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                name="businessDescription"
                placeholder="Brief description of your business"
                value={formData.businessDescription}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessWebsite">Website</Label>
                <Input
                  id="businessWebsite"
                  name="businessWebsite"
                  placeholder="https://your-website.com"
                  value={formData.businessWebsite}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Email</Label>
                <Input
                  id="businessEmail"
                  name="businessEmail"
                  placeholder="contact@your-business.com"
                  value={formData.businessEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                name="businessAddress"
                placeholder="Your business address"
                value={formData.businessAddress}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || saving}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshTemplates}
              disabled={!formData.id || testing || saving}
            >
              Refresh Templates
            </Button>
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Use this URL to set up your WhatsApp webhook in the Meta Business
            Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/whatsapp/webhook`
                : "https://your-domain.com/api/whatsapp/webhook"}
            </code>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Set this URL in the Meta Developer Portal and use your Webhook
            Verify Token for verification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
