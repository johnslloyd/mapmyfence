import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function EditFenceLineCard({
  editingLine,
  setEditingLine,
  handleUpdateLine,
  updateLineMutation,
  setSelectedLineId,
  refetchProject,
  className,
}: {
  editingLine: any;
  setEditingLine: any;
  handleUpdateLine: any;
  updateLineMutation: any;
  setSelectedLineId: any;
  refetchProject: any;
  className?: string;
}) {
  return (
    <Card className={cn("z-10 w-full max-w-md rounded-lg", className)}>
      <CardHeader>
        <CardTitle>Editing Line</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Material</Label>
            <Select
              value={editingLine.material}
              onValueChange={(value) => setEditingLine({ ...editingLine, material: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wood_pine">Wood: Pine</SelectItem>
                <SelectItem value="wood_cedar">Wood: Cedar</SelectItem>
                <SelectItem value="vinyl">Vinyl</SelectItem>
                <SelectItem value="iron">Iron</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Height (ft)</Label>
            <Select
              value={String(editingLine.height)}
              onValueChange={(value) => setEditingLine({ ...editingLine, height: parseFloat(value) })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 ft</SelectItem>
                <SelectItem value="6">6 ft</SelectItem>
                <SelectItem value="8">8 ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Drag the points on the map to adjust the line.</p>
        <div className="flex gap-2">
          <Button
            onClick={() => handleUpdateLine(editingLine)}
            disabled={updateLineMutation.isPending}
            className="flex-1"
          >
            {updateLineMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedLineId(null);
              setEditingLine(null);
              refetchProject();
            }}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
