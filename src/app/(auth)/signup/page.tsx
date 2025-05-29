// src/app/(auth)/signup/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!tenantName.trim() || !subdomain.trim()) {
      setError("Tenant Name and Subdomain are required.");
      setLoading(false);
      toast({
        title: "Signup Failed",
        description: "Tenant Name and Subdomain are required.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic subdomain validation (you might want more robust validation)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
        setError("Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.");
        setLoading(false);
        toast({
            title: "Invalid Subdomain",
            description: "Subdomain format is invalid.",
            variant: "destructive",
        });
        return;
    }


    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_name: tenantName, // Supabase convention is often snake_case for metadata
          subdomain: subdomain,
        },
        // emailRedirectTo: `${window.location.origin}/auth/callback`, 
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      toast({
        title: "Signup Failed",
        description: signUpError.message,
        variant: "destructive",
      });
    } else {
      if (data.user && !data.session) {
        setMessage("Signup successful! Please check your email to confirm your account. Tenant creation will be finalized after confirmation.");
        toast({
          title: "Confirmation Email Sent",
          description: "Please check your email to complete the signup process. Tenant setup will follow.",
        });
      } else if (data.user && data.session) {
        setMessage("Signup successful! Redirecting... Tenant setup will follow.");
        toast({
          title: "Signup Successful!",
          description: "You are now logged in. Tenant setup will proceed.",
        });
        // You might want to redirect to a "tenant pending creation" page or dashboard
        // The actual creation of Tenant record and linking happens via backend logic (e.g., Supabase Trigger)
        router.push("/dashboard"); 
        router.refresh();
      } else {
        setMessage("Signup request processed. Please follow any instructions sent to your email.");
        toast({
          title: "Signup Request Processed",
          description: "Please follow instructions sent to your email. Tenant setup will follow.",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4 text-2xl">Create Your Account & Tenant</CardTitle>
          <CardDescription>Sign up to start using Conecta Hub with your own workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input 
                id="tenantName" 
                type="text" 
                placeholder="Your Company Name" 
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input 
                id="subdomain" 
                type="text" 
                placeholder="your-company" 
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                required 
              />
              <p className="text-xs text-muted-foreground">This will be part of your workspace URL (e.g., your-company.conectahub.app)</p>
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Create a strong password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {message && <p className="text-sm text-green-600 text-center">{message}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up & Create Tenant"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
