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
import { useState } from "react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // The server always returns the same generic message whether or
      // not the email is registered (see authRoutes.ts) — showing the
      // success state on any 2xx response is the correct behavior here,
      // not a bug to "fix" by branching on whether it found an account.
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <Alert>
              <AlertDescription>
                If an account exists for {email}, we've sent a password reset link. Check your
                inbox (and spam folder).
              </AlertDescription>
            </Alert>
          ) : (
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
