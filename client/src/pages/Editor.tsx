import { Layout } from "@/components/Layout";
import { LatLng } from "leaflet";
import { useRoute, useLocation } from "wouter";
import { useProject, useCreateFenceLine, useDeleteFenceLine, useUpdateFenceLine, useEstimates } from "@/hooks/use-projects";
import { MapEditorComponent } from "@/components/MapEditorComponent";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Save, Menu, Camera, ClipboardList, Plus } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotFound from "./not-found";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SignUpToSaveModal } from "@/components/SignUpToSaveModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { NewProjectInstructions } from "@/components/NewProjectInstructions";
import { EditFenceLineCard } from "@/components/EditFenceLineCard";
import { NewFenceLineCard } from "@/components/NewFenceLineCard";

type UiState = "HIDDEN" | "INSTRUCTIONS" | "DRAWING" | "SIDEBAR" | "EDITING";

const STORE_LABELS: Record<string, string> = {
  lowes: "Lowe's",
  home_depot: "Home Depot",
};

function MaterialEstimates({ projectId }: { projectId: number }) {
  const { data: estimates, isLoading, error } = useEstimates(projectId);
  // Homeowners shop at one store, not a mix — the server returns one
  // complete option per store (sorted cheapest-first); this just tracks
  // which one is currently shown. Falls back to the cheapest whenever the
  // selection doesn't match an available option (initial load, or the
  // selected store dropped out because it no longer prices everything).
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">Calculating estimates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive border-2 border-dashed border-destructive rounded-lg">
        <p className="text-sm">Error calculating estimates.</p>
      </div>
    );
  }

  if (!estimates || estimates.options.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">No materials needed.</p>
      </div>
    );
  }

  const options = estimates.options;
  const active = options.find((o) => o.store === selectedStore) ?? options[0];

  return (
    <div className="space-y-4">
      {options.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option, i) => (
            <button
              key={option.store}
              onClick={() => setSelectedStore(option.store)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                option.store === active.store
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {STORE_LABELS[option.store] || option.store}
                </span>
                {i === 0 && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-primary/30 text-primary shrink-0">
                    Best price
                  </Badge>
                )}
              </div>
              <div className="font-bold">${option.totalCost.toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center font-bold">
        <span>Total Estimated Cost:</span>
        <span>${active.totalCost.toFixed(2)}</span>
      </div>
      <div className="space-y-2">
        {active.materials.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm gap-2">
            <span className="min-w-0">
              {item.quantity}x{" "}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </span>
            <span className="shrink-0">${item.totalCost.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground pt-2">
        Estimate assumes a standard wood post-and-picket fence, all materials
        from {STORE_LABELS[active.store] || active.store}. Prices are based on
        current material listings and do not include taxes, delivery, or labor.
      </div>
    </div>
  );
}

export default function Editor() {
  const [match, params] = useRoute("/editor/:id");
  const projectId = match && params?.id ? parseInt(params.id) : undefined;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get('guest') === 'true';

  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(
    projectId,
    { isGuest: isGuest && !isAuthenticated }
  );

  const [uiState, setUiState] = useState<UiState>("HIDDEN");
  const [isDrawing, setIsDrawing] = useState(false);

  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [hasTriedSavingPendingLine, setHasTriedSavingPendingLine] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [editingLine, setEditingLine] = useState<any | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // On mobile the fence-line list lives in a full-screen sheet over the map.
  // Once the user starts drawing or editing a line, close it so the map
  // (and the drawing/edit controls on it) are actually visible.
  useEffect(() => {
    if (uiState !== "SIDEBAR") {
      setMobileSidebarOpen(false);
    }
  }, [uiState]);

  useEffect(() => {
    if (project && !isProjectLoading) {
      if (project.fenceLines && project.fenceLines.length === 0) {
        setUiState("INSTRUCTIONS");
      } else if (uiState !== 'EDITING' && uiState !== 'DRAWING') {
        setUiState("SIDEBAR");
      }
    } else {
      setUiState("HIDDEN");
    }
  }, [project, isProjectLoading]);

  useEffect(() => {
    if (selectedLineId && project?.fenceLines) {
      const line = project.fenceLines.find((l: any) => l.id === selectedLineId);
      setEditingLine(line ? { ...line, coordinates: [...line.coordinates] } : null);
      setUiState("EDITING");
    } else {
      setEditingLine(null);
      if (uiState === 'EDITING') {
        setUiState('SIDEBAR');
      }
    }
  }, [selectedLineId, project?.fenceLines]);

  const handleStartDrawing = () => {
    setSelectedLineId(null);
    setIsDrawing(true);
    setUiState("DRAWING");
  };

  const createLineMutation = useCreateFenceLine();
  const deleteLineMutation = useDeleteFenceLine();
  const updateLineMutation = useUpdateFenceLine();

  const handleUpdateLine = async (line: any) => {
    if (!line) return;
    // Great-circle distance via Leaflet's LatLng.distanceTo (matches how
    // MapEditorComponent computes length while drawing) — NOT a flat
    // sqrt(dLat^2 + dLng^2) * metersPerDegree approximation. A degree of
    // longitude is shorter than a degree of latitude by cos(latitude), so
    // that naive formula overestimated east-west lines by ~29% at this
    // project's test latitude (~39N). Every edit was silently inflating
    // the line's length, and therefore its material estimate.
    let distMeters = 0;
    for (let i = 0; i < line.coordinates.length - 1; i++) {
      const p1 = new LatLng(line.coordinates[i].lat, line.coordinates[i].lng);
      const p2 = new LatLng(line.coordinates[i + 1].lat, line.coordinates[i + 1].lng);
      distMeters += p1.distanceTo(p2);
    }
    const newLength = distMeters * 3.28084;

    try {
      await updateLineMutation.mutateAsync({
        id: line.id,
        projectId: project.id,
        coordinates: line.coordinates.map(({ id, fenceLineId, ...rest }: any, order: number) => ({ ...rest, order })),
        length: newLength,
        material: line.material,
        height: line.height,
      });
      toast({ title: "Success", description: "Fence line updated." });
      setSelectedLineId(null);
      setUiState("SIDEBAR");
    } catch (error: any) {
      console.error("Failed to update line", error);
      toast({ title: 'Error', description: error?.message || 'Failed to update fence line', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isAuthenticated && projectId && !authLoading) {
      refetchProject();
    }
  }, [isAuthenticated, authLoading, projectId, refetchProject]);

  useEffect(() => {
    const savePendingLine = async () => {
      if (isAuthenticated && projectId && project && !hasTriedSavingPendingLine) {
        const pendingLineJSON = localStorage.getItem(`pendingFenceLine_${projectId}`);
        if (pendingLineJSON) {
          setHasTriedSavingPendingLine(true);
          const pendingLine = JSON.parse(pendingLineJSON);
          try {
            await createLineMutation.mutateAsync({
              projectId: pendingLine.projectId,
              name: `Line ${project.fenceLines ? project.fenceLines.length + 1 : 1}`,
              material: pendingLine.material,
              height: pendingLine.height,
              length: pendingLine.length,
              color: "natural",
              coordinates: pendingLine.points.map((p: any, idx: number) => ({
                lat: p.lat,
                lng: p.lng,
                order: idx
              }))
            });
            toast({ title: "Success", description: "Your fence line has been saved." });
            localStorage.removeItem(`pendingFenceLine_${projectId}`);
            refetchProject();
            setUiState("SIDEBAR");
          } catch (error: any) {
            console.error("Failed to save pending line", error);
            toast({ title: 'Error', description: error?.message || 'Failed to save your pending fence line.', variant: 'destructive' });
            setHasTriedSavingPendingLine(false);
          }
        }
      }
    };

    if (!authLoading && !isProjectLoading && isAuthenticated) {
      savePendingLine();
    }
  }, [isAuthenticated, projectId, project, isProjectLoading, authLoading, createLineMutation, toast, refetchProject, hasTriedSavingPendingLine]);

  if (isProjectLoading || authLoading) {
    return (
      <Layout>
        <div className="h-[calc(1vh-4rem)] p-4 flex gap-4">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return <NotFound />;
  }

  const handleSaveLine = async (points: any[], length: number) => {
    if (!isAuthenticated) {
      const pendingLine = { projectId: project.id, points, length, material: 'wood_cedar', height: 6 };
      localStorage.setItem(`pendingFenceLine_${project.id}`, JSON.stringify(pendingLine));
      setShowSignUpModal(true);
      return;
    }
    try {
      await createLineMutation.mutateAsync({
        projectId: project.id,
        name: `Line ${project.fenceLines ? project.fenceLines.length + 1 : 1}`,
        material: 'wood_cedar',
        height: 6,
        length,
        color: "natural",
        coordinates: points.map(({ id, ...rest }, idx) => ({
          ...rest,
          order: idx
        }))
      });
      toast({ title: "Success", description: "Fence line saved." });
      setIsDrawing(false);
      setUiState("SIDEBAR");
    } catch (error: any) {
      console.error("Failed to save line", error);
      toast({ title: 'Error', description: error?.message || 'Failed to add fence line', variant: 'destructive' });
    }
  };

  const handleDeleteLine = async (lineId: string | number) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }
    try {
      await deleteLineMutation.mutate({ id: lineId as number, projectId: project.id });
    } catch (error: any) {
      console.error("Failed to delete line", error);
      toast({ title: 'Error', description: error?.message || 'Failed to delete fence line', variant: 'destructive' });
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    if (project.fenceLines && project.fenceLines.length === 0) {
      setUiState("INSTRUCTIONS");
    } else {
      setUiState("SIDEBAR");
    }
  };

  const EditorSidebar = () => (
    <div className="flex flex-col bg-panel z-10 w-full h-full">
      <div className="p-4 border-b">
        {!isAuthenticated ? (
          <Button
            variant="default"
            className="w-full mb-4 gap-2"
            onClick={() => setShowSignUpModal(true)}
          >
            <Save className="w-4 h-4" /> Save Your Project (Login/Register)
          </Button>
        ) : (
          <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
        )}

        <h1 className="text-xl font-display font-bold truncate">{project.name}</h1>
        <p className="text-sm text-muted-foreground truncate">{project.address}</p>
      </div>
      <ScrollArea className="flex-1">
        <Tabs defaultValue="lines">
          <div className="px-4 pt-4 sticky top-0 bg-panel z-10 border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="lines">Fence Lines</TabsTrigger>
              <TabsTrigger value="details">Project Details</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="lines" className="mt-2">
            <div className="px-4 py-2 bg-muted/30 border-y flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {project.fenceLines?.length || 0} Lines Defined
              </span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Total: {project.fenceLines?.reduce((sum: number, line: any) => sum + (line.length || 0), 0).toFixed(0)} ft
              </Badge>
            </div>
            <div className="p-4 space-y-3">
              {project.fenceLines?.map((line: any) => (
                <Card
                  key={line.id}
                  className={cn(
                    "group overflow-hidden border-border/60 hover:border-primary/50 transition-colors cursor-pointer",
                    selectedLineId === line.id && "border-primary/80"
                  )}
                  onClick={() => setSelectedLineId(selectedLineId === line.id ? null : line.id)}
                >
                  <div className="p-3 flex items-start gap-3">
                    <div className="w-2 h-full min-h-[3rem] rounded-full bg-primary/20 shrink-0 self-stretch" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{line.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteLine(line.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {line.material}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {line.height} ft high
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {line.length ? `${line.length.toFixed(0)} ft` : "No length"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Button className="w-full gap-2" onClick={handleStartDrawing}>
                <Plus className="w-4 h-4" /> New Fence Line
              </Button>
            </div>
            <div className="p-4 space-y-4 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="w-4 h-4" />
                Material Estimates
              </h4>
              <MaterialEstimates projectId={project.id} />
            </div>
          </TabsContent>
          <TabsContent value="details" className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Project Name</Label>
                <div className="text-sm font-medium">{project.name}</div>
              </div>
              <div>
                <Label>Address</Label>
                <div className="text-sm text-muted-foreground">{project.address || "No address provided"}</div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm text-muted-foreground">{project.description || "No notes"}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
  
  const RightPanel = () => {
      switch (uiState) {
          case "INSTRUCTIONS":
              return <NewProjectInstructions onStartDrawing={handleStartDrawing} />;
          case "DRAWING":
              return <NewFenceLineCard onCancel={cancelDrawing} />;
          case "SIDEBAR":
              // Floating overlay needs its own card chrome (shadow, rounded
              // corners, clipped) to read as a card sitting on the map.
              // Docked, the panel's own border-l already delineates it —
              // that chrome would just double up as a card-in-a-card.
              return isPanelDocked
                  ? <div className="h-full"><EditorSidebar /></div>
                  : <div className="bg-panel h-full overflow-hidden shadow-lg rounded-lg"><EditorSidebar /></div>;
          case "EDITING":
              return editingLine ? (
                  <EditFenceLineCard
                      editingLine={editingLine}
                      setEditingLine={setEditingLine}
                      handleUpdateLine={handleUpdateLine}
                      updateLineMutation={updateLineMutation}
                      setSelectedLineId={setSelectedLineId}
                      refetchProject={refetchProject}
                  />
              ) : null;
          default:
              return null;
      }
  }

  // Before a fence line exists (INSTRUCTIONS/DRAWING), focus stays on the
  // map — that's the whole point of those states, so the panel stays a
  // compact floating overlay. Once there's something to review — the line
  // list + material estimates (SIDEBAR), or a single line's detail
  // (EDITING) — dock the panel as a real, wide column instead and let the
  // map's flex container shrink to make room. This is the state that
  // actually grows over time (more lines, richer estimates), so it gets
  // the real estate. MapEditorComponent notices the resulting resize on
  // its own (ResizeObserver on the map container) and calls Leaflet's
  // invalidateSize() — no coordination needed here.
  const isPanelDocked = uiState === "SIDEBAR" || uiState === "EDITING";

  return (
    <Layout>
      <div className="flex h-full relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative h-full min-w-0 bg-secondary/20">
          <MapEditorComponent
            initialCenter={undefined}
            initialAddress={project.address}
            onSave={handleSaveLine}
            isSaving={createLineMutation.isPending}
            existingLines={project.fenceLines || []}
            isMobile={isMobile}
            selectedLineId={selectedLineId}
            onLineSelect={setSelectedLineId}
            editingLine={editingLine}
            onLineUpdate={handleUpdateLine}
            isDrawing={isDrawing}
            onCancelDrawing={cancelDrawing}
            controlsPosition="right"
          />

          {/* Mobile Menu Trigger */}
          <div className="md:hidden absolute top-4 left-4 z-30">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="secondary" className="shadow-md h-10 w-10 rounded-full" aria-label="Open project menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] sm:w-[400px]">
                <EditorSidebar />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Right Panel — floating overlay (nothing to review yet) */}
          {!isPanelDocked && (
            <div className="hidden md:block absolute top-4 right-4 z-10 w-80 lg:w-96 h-[calc(100%-2rem)]">
                <RightPanel />
            </div>
          )}
        </div>

        {/* Desktop Right Panel — docked column (there's a line to review: wider, map makes room) */}
        {isPanelDocked && (
          <div className="hidden md:block relative z-10 w-[480px] lg:w-[560px] h-full shrink-0 border-l border-border overflow-y-auto p-4">
            <RightPanel />
          </div>
        )}
      </div>

      <SignUpToSaveModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        projectId={project.id}
      />
    </Layout>
  );
}