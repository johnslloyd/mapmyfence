import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DoorOpen, X, Trash2 } from "lucide-react";

const GATE_LABEL: Record<string, string> = { single: "Single Gate", double: "Double Gate" };

export function EditFenceLineCard({
  editingLine,
  setEditingLine,
  handleUpdateLine,
  updateLineMutation,
  setSelectedLineId,
  refetchProject,
  className,
  placingGateType = null,
  onStartPlacingGate = () => {},
  onCancelPlacingGate = () => {},
  onDeleteGate = () => {},
  deleteGateMutation,
}: {
  editingLine: any;
  setEditingLine: any;
  handleUpdateLine: any;
  updateLineMutation: any;
  setSelectedLineId: any;
  refetchProject: any;
  className?: string;
  placingGateType?: 'single' | 'double' | null;
  onStartPlacingGate?: (type: 'single' | 'double') => void;
  onCancelPlacingGate?: () => void;
  onDeleteGate?: (gateId: number) => void;
  deleteGateMutation?: any;
}) {
  const gates: any[] = editingLine.gates || [];
  return (
    <Card className={cn("z-10 w-full max-w-md rounded-lg bg-panel text-panel-foreground", className)}>
      <CardHeader>
        <CardTitle>Editing Line</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Name</Label>
          <Input
            className="h-9"
            value={editingLine.name ?? ""}
            onChange={(e) => setEditingLine({ ...editingLine, name: e.target.value })}
            placeholder="e.g. Backyard fence"
            maxLength={100}
          />
        </div>
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
                <SelectItem value="vinyl" disabled>Vinyl (pricing coming soon)</SelectItem>
                <SelectItem value="iron" disabled>Iron (pricing coming soon)</SelectItem>
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
                <SelectItem value="6">6 ft</SelectItem>
                <SelectItem value="8">8 ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Drag the points on the map to adjust the line.</p>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5" /> Gates</Label>
          {gates.length > 0 && (
            <div className="space-y-1.5">
              {gates.map((gate) => (
                <div key={gate.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5 text-sm">
                  <span>{GATE_LABEL[gate.type] || "Gate"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteGate(gate.id)}
                    disabled={deleteGateMutation?.isPending}
                    aria-label={`Remove ${GATE_LABEL[gate.type] || "gate"}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {placingGateType ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-medium">
              <span>Click the highlighted line to place the {placingGateType} gate</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onCancelPlacingGate} aria-label="Cancel placing gate">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onStartPlacingGate('single')}>
                + Single Gate
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onStartPlacingGate('double')}>
                + Double Gate
              </Button>
            </div>
          )}
        </div>

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
