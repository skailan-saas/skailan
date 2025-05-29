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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Supabase will send a confirmation email to this address.
        // You can configure the email template in your Supabase project settings.
        // emailRedirectTo: `${window.location.origin}/auth/callback`, // URL to redirect to after email confirmation
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
      // data.user will exist if signup was successful, data.session will be null until email confirmed (if enabled)
      if (data.user && !data.session) {
        setMessage("Signup successful! Please check your email to confirm your account.");
        toast({
          title: "Confirmation Email Sent",
          description: "Please check your email to complete the signup process.",
        });
      } else if (data.user && data.session) {
        // This case might happen if email confirmation is disabled on Supabase
        setMessage("Signup successful! Redirecting...");
        toast({
          title: "Signup Successful!",
          description: "You are now logged in.",
        });
        router.push("/dashboard");
        router.refresh();
      } else {
         // A general success message if the specific state isn't clear
        setMessage("Signup request processed. Please follow any instructions sent to your email.");
        toast({
          title: "Signup Request Processed",
          description: "Please follow any instructions sent to your email, if applicable.",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4 text-2xl">Create an Account</CardTitle>
          <CardDescription>Sign up to start using Conecta Hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
                minLength={6} // Supabase default minimum password length
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {message && <p className="text-sm text-green-600 text-center">{message}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
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
