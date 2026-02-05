import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NewFenceLineCard({
  onCancel,
  className,
}: {
  onCancel: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("z-10 w-full max-w-md rounded-lg", className)}>
      <CardHeader>
        <CardTitle>New Fence Line</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click on the map to draw your fence line. Click the first point again to finish.
        </p>
        <p className="text-xs text-muted-foreground">
            You can specify materials and other details after saving the line.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
