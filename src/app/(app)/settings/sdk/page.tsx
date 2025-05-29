import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Download, Copy, Palette, MessageCircleQuestion } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SdkSettingsPage() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Website Chat SDK</h1>
          <p className="text-muted-foreground">
            Integrate Conecta Hub chatbot into your website seamlessly.
          </p>
        </div>
         <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> SDK Documentation
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Installation</CardTitle>
          <CardDescription>
            Add the following script to your website to enable the chat widget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="block text-sm font-medium text-foreground mb-1">Your API Key (Tenant Specific)</Label>
            <div className="flex items-center gap-2">
              <Input id="apiKey" type="text" value="ch_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="font-mono"/>
              <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This key authenticates the SDK for your organization.</p>
          </div>
          <div>
            <Label htmlFor="sdkScript" className="block text-sm font-medium text-foreground mb-1">Embed Script</Label>
            <div className="bg-muted p-3 rounded-md relative">
            <Textarea
              id="sdkScript"
              readOnly
              rows={6}
              value={`<!-- Conecta Hub Chat SDK -->
<script 
  src="https://cdn.conectahub.com/sdk/v1/chat.js" 
  data-api-key="ch_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
  async 
  defer
></script>`}
              className="font-mono text-sm bg-transparent border-0 focus-visible:ring-0 resize-none p-0"
            />
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Copy and paste this script tag preferably before the closing <code className="bg-muted px-1 rounded-sm">&lt;/body&gt;</code> tag of your website.
            </p>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                For advanced configurations and event handling, please refer to the SDK documentation.
            </p>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Widget Customization</CardTitle>
          <CardDescription>
            Tailor the appearance and behavior of your website chat widget.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-md flex items-center"><Palette className="h-5 w-5 mr-2 text-primary"/> Appearance</h3>
                <div>
                    <Label htmlFor="widgetColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                        <Input type="color" id="widgetColor" defaultValue="#29ABE2" className="w-12 h-10 p-1" />
                        <Input type="text" defaultValue="#29ABE2" className="flex-1" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Sets the main color for the chat widget header and buttons.</p>
                </div>
                 <div>
                    <Label htmlFor="widgetPosition">Widget Position</Label>
                    <select id="widgetPosition" className="w-full mt-1 block p-2 border border-input rounded-md bg-background">
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                    </select>
                 </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="showGreeting" defaultChecked />
                    <Label htmlFor="showGreeting">Show Welcome Greeting</Label>
                </div>
                 <div>
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea id="welcomeMessage" placeholder="Hi there! How can we help you today?" defaultValue="Hi there! 👋 How can we help you today?" />
                 </div>
            </div>
             <div className="space-y-4">
                <h3 className="font-semibold text-md flex items-center"><MessageCircleQuestion className="h-5 w-5 mr-2 text-primary"/> Behavior</h3>
                <div>
                    <Label htmlFor="defaultFlow">Default Flow</Label>
                    <select id="defaultFlow" className="w-full mt-1 block p-2 border border-input rounded-md bg-background">
                        <option value="welcome-flow">Welcome Flow (Default)</option>
                        <option value="sales-inquiry">Sales Inquiry Flow</option>
                        <option value="support-request">Support Request Flow</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">The conversational flow to start when a user initiates a chat.</p>
                 </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Switch id="proactiveChat" />
                    <Label htmlFor="proactiveChat">Enable Proactive Chat Triggers</Label>
                </div>
                 <div>
                    <Label htmlFor="proactiveDelay">Proactive Message Delay (seconds)</Label>
                    <Input type="number" id="proactiveDelay" defaultValue="10" placeholder="e.g., 10" />
                    <p className="text-xs text-muted-foreground mt-1">Time after page load before showing a proactive message (if enabled).</p>
                 </div>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">Save Customizations</Button>
        </CardFooter>
      </Card>
    </div>
    </ScrollArea>
  );
}
