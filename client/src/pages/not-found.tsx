import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto border-none shadow-2xl">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
              Page not found
            </h1>
            <p className="text-muted-foreground text-sm">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>

          <Link href="/">
            <Button className="w-full sm:w-auto" size="lg">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
