
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
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  // propertyId: the guest-created property to claim (ownership lives on
  // properties now, not projects — see CLAUDE.md's Property/Project
  // restructure). returnTo: where to send them back — the editor path
  // for the specific project they were working in, so Editor.tsx
  // remounts there and its pending-fence-line-save effect can run.
  const propertyId = searchParams.get("propertyId");
  const returnTo = searchParams.get("returnTo");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Client-side validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, propertyId }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user);
        toast({ title: "Account created", description: "You are now signed in.", variant: "success" });
        if (returnTo) {
          setLocation(returnTo);
        } else {
          setLocation("/");
        }
      } else {
        // Try to parse error message, but handle non-JSON responses
        try {
          const data = await res.json();
          setError(data.message || "Failed to register");
        } catch {
          setError(`Failed to register (${res.status} ${res.statusText})`);
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error?.message || "Failed to register. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Create an account
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
