import { Layout } from "@/components/Layout";
import { useRoute, useLocation } from "wouter";
import { useProject, useCreateFenceLine, useDeleteFenceLine, useUpdateFenceLine } from "@/hooks/use-projects";
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
    let dist = 0;
    for (let i = 0; i < line.coordinates.length - 1; i++) {
      const p1 = { lat: line.coordinates[i].lat, lng: line.coordinates[i].lng };
      const p2 = { lat: line.coordinates[i + 1].lat, lng: line.coordinates[i + 1].lng };
      dist += Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2));
    }
    const newLength = dist * 3.28084 * 111320;

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
    <div className="flex flex-col bg-card z-10 w-full h-full">
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
      <Tabs defaultValue="lines" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="lines">Fence Lines</TabsTrigger>
            <TabsTrigger value="details">Project Details</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="lines" className="flex-1 min-h-0 flex flex-col mt-2">
          <div className="px-4 py-2 bg-muted/30 border-y flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {project.fenceLines?.length || 0} Lines Defined
            </span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Total: {project.fenceLines?.reduce((sum: number, line: any) => sum + (line.length || 0), 0).toFixed(0)} ft
            </Badge>
          </div>
          <ScrollArea className="max-h-[500px]">
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
          </ScrollArea>
          <div className="p-4 space-y-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Camera className="w-4 h-4" />
              Photos
            </h4>
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">Photo uploads coming soon!</p>
            </div>

            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="w-4 h-4" />
              Material Estimates
            </h4>
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">Estimates coming soon!</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="details" className="flex-1 p-4">
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
    </div>
  );
  
  const RightPanel = () => {
      switch (uiState) {
          case "INSTRUCTIONS":
              return <NewProjectInstructions onStartDrawing={handleStartDrawing} />;
          case "DRAWING":
              return <NewFenceLineCard onCancel={cancelDrawing} />;
          case "SIDEBAR":
              return <div className="bg-card h-full overflow-hidden shadow-lg rounded-lg"><EditorSidebar /></div>;
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

  return (
    <Layout>
      <div className="flex h-full relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative h-full bg-secondary/20">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="secondary" className="shadow-md h-10 w-10 rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] sm:w-[400px]">
                <EditorSidebar />
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Right Panel */}
          <div className="hidden md:block absolute top-4 right-4 z-10 w-80 lg:w-96 h-[calc(100%-2rem)]">
              <RightPanel />
          </div>
        </div>
      </div>

      <SignUpToSaveModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        projectId={project.id}
      />
    </Layout>
  );
}