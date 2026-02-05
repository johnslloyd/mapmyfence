import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewProjectInstructionsProps {
  onStartDrawing: () => void;
  className?: string;
}

export function NewProjectInstructions({ onStartDrawing, className }: NewProjectInstructionsProps) {
  return (
    <Card className={cn("z-10 w-full max-w-md rounded-lg", className)}>
      <CardHeader>
        <CardTitle>Create your first fence line</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Your project is ready. To get started, create a new fence line on the map.
        </p>
        <Button onClick={onStartDrawing} className="w-full gap-2">
          <Plus className="w-4 h-4" /> Create a Fence Line
        </Button>
      </CardContent>
    </Card>
  );
}
