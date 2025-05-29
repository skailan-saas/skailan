import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const topics = [
  { title: "Getting Started", description: "Initial setup and account configuration.", icon: FileText, link: "#getting-started" },
  { title: "Agent Workspace", description: "Navigating and using the agent dashboard.", icon: FileText, link: "#agent-workspace" },
  { title: "Flow Builder Guide", description: "Creating and managing conversational flows.", icon: FileText, link: "#flow-builder" },
  { title: "AI Features", description: "Using AI-assisted responses and summaries.", icon: FileText, link: "#ai-features" },
  { title: "Analytics & Reporting", description: "Understanding your performance metrics.", icon: FileText, link: "#analytics" },
  { title: "Website SDK Integration", description: "Adding the chat widget to your site.", icon: FileText, link: "#sdk-integration" },
  { title: "User & Role Management", description: "Managing access and permissions.", icon: FileText, link: "#user-management" },
  { title: "API Reference", description: "Integrating with Conecta Hub API.", icon: FileText, link: "#api-reference" },
];

export default function DocumentationPage() {
  return (
    <div className="p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Conecta Hub Documentation</h1>
        <p className="text-lg text-muted-foreground mt-2">Find guides, tutorials, and API references to help you get the most out of Conecta Hub.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documentation (e.g., 'how to create a flow')"
          className="w-full max-w-2xl pl-10 py-3 text-base rounded-lg shadow-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic) => (
          <Card key={topic.title} className="hover:shadow-xl transition-shadow duration-300 ease-in-out group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <topic.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{topic.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
              <Link href={topic.link} className="text-sm font-medium text-primary hover:underline group-hover:text-primary-darker flex items-center">
                Read more <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <section id="getting-started" className="space-y-4 pt-8">
        <h2 className="text-2xl font-semibold border-b pb-2">Getting Started</h2>
        <p className="text-muted-foreground">Welcome to Conecta Hub! This section will guide you through the initial setup of your account, connecting your first channels, and navigating the main dashboard.</p>
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold">Step 1: Account Setup</h3>
            <p className="text-sm text-muted-foreground">Details on creating your tenant and inviting team members.</p>
             <h3 className="font-semibold mt-2">Step 2: Connecting Channels</h3>
            <p className="text-sm text-muted-foreground">Instructions for WhatsApp, Facebook, Instagram, and Web.</p>
          </CardContent>
        </Card>
      </section>
      {/* Add more sections for other topics similarly */}
       <footer className="text-center text-muted-foreground text-sm pt-8 pb-4">
        © {new Date().getFullYear()} Conecta Hub. All rights reserved.
      </footer>
    </div>
  );
}
