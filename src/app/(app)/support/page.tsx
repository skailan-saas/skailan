import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LifeBuoy, MessageSquare, Search, BookOpen, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";

const faqItems = [
  {
    question: "How do I connect my WhatsApp Business API account?",
    answer: "You can connect your WhatsApp Business API account through the 'Channels' section in Settings. Follow the on-screen instructions and provide the necessary API credentials.",
    link: "/documentation#whatsapp-setup"
  },
  {
    question: "What are the limitations on message broadcasting?",
    answer: "Message broadcasting is subject to channel-specific policies (e.g., WhatsApp templates). Ensure your messages comply with these policies to avoid disruptions.",
    link: "/documentation#broadcasting"
  },
  {
    question: "How does the AI response suggestion work?",
    answer: "Our AI analyzes the conversation history and the latest customer message to suggest relevant and context-aware responses, powered by advanced language models.",
    link: "/documentation#ai-features"
  },
  {
    question: "Can I customize the website chat widget?",
    answer: "Yes, the website chat widget can be customized. Options for colors, welcome messages, and widget positioning are available in the SDK settings.",
    link: "/settings/sdk"
  }
];

export default function SupportPage() {
  return (
    <div className="p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="text-center">
        <LifeBuoy className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground">Conecta Hub Support</h1>
        <p className="text-lg text-muted-foreground mt-2">We&apos;re here to help! Find answers to your questions or contact our support team.</p>
      </div>

      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Search our Knowledge Base</CardTitle>
          <CardDescription>Quickly find answers to common questions and troubleshooting guides.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Ask a question (e.g., 'how to add an agent')"
              className="w-full pl-10 py-3 text-base rounded-lg"
            />
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/documentation" className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <BookOpen className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold">Full Documentation</h3>
                <p className="text-sm text-muted-foreground">Browse all guides and articles.</p>
            </Link>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Lightbulb className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold">Feature Tutorials</h3>
                <p className="text-sm text-muted-foreground">Step-by-step video guides.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqItems.map((item, index) => (
            <details key={index} className="group p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
                {item.question}
                <ArrowRight className="h-4 w-4 transform transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <p className="text-sm text-muted-foreground mt-2">{item.answer}
                {item.link && <Link href={item.link} className="text-primary hover:underline ml-1">Learn more</Link>}
              </p>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-primary" /> Contact Support
          </CardTitle>
          <CardDescription>Can&apos;t find what you need? Submit a support ticket and our team will get back to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g., Issue with flow builder" />
          </div>
          <div>
            <Label htmlFor="description">Describe your issue</Label>
            <Textarea id="description" placeholder="Please provide as much detail as possible..." rows={5} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">Submit Ticket</Button>
        </CardFooter>
      </Card>
       <footer className="text-center text-muted-foreground text-sm pt-8 pb-4">
        For urgent issues, please call our support line: +1-800-555-HUBB
      </footer>
    </div>
  );
}
