import { Layout } from "@/components/Layout";
import { useRoute, useLocation } from "wouter";
import { useProject, useCreateFenceLine, useDeleteFenceLine } from "@/hooks/use-projects";
import { MapEditorComponent } from "@/components/MapEditorComponent";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Layers, Save } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import NotFound from "./not-found";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SignUpToSaveModal } from "@/components/SignUpToSaveModal"; 

export default function Editor() {
  const [match, params] = useRoute("/editor/:id");
  const projectId = match && params?.id ? parseInt(params.id) : undefined;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get('guest') === 'true';

  // After authentication, fetch project without guest flag
  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(
    projectId, 
    { isGuest: isGuest && !isAuthenticated }
  );

  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [pendingFenceLine, setPendingFenceLine] = useState<any>(null);
  const [hasTriedSavingPendingLine, setHasTriedSavingPendingLine] = useState(false);
  const createLineMutation = useCreateFenceLine();
  const deleteLineMutation = useDeleteFenceLine();

  // Refetch project when authentication status changes (e.g., after registration)
  useEffect(() => {
    if (isAuthenticated && projectId && !authLoading) {
      refetchProject();
    }
  }, [isAuthenticated, authLoading, projectId, refetchProject]);

  useEffect(() => {
    const savePendingLine = async () => {
      // Only try to save if user is authenticated, project is loaded, and we haven't tried yet
      if (isAuthenticated && projectId && project && !hasTriedSavingPendingLine) {
        const pendingLineJSON = localStorage.getItem(`pendingFenceLine_${projectId}`);
        if (pendingLineJSON) {
          setHasTriedSavingPendingLine(true); // Mark as attempted to prevent duplicate saves
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
          } catch (error: any) {
            console.error("Failed to save pending line", error);
            toast({ title: 'Error', description: error?.message || 'Failed to save your pending fence line.', variant: 'destructive' });
            // Reset the flag so we can try again
            setHasTriedSavingPendingLine(false);
          }
        }
      }
    };

    // Only attempt to save when everything is loaded and user is authenticated
    if (!authLoading && !isProjectLoading && isAuthenticated) {
      savePendingLine();
    }
  }, [isAuthenticated, projectId, project, isProjectLoading, authLoading, createLineMutation, toast, refetchProject, hasTriedSavingPendingLine]);

  if (isProjectLoading || authLoading) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] p-4 flex gap-4">
          <Skeleton className="w-1/4 h-full rounded-2xl" />
          <Skeleton className="w-3/4 h-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return <NotFound />;
  }

  const handleSaveLine = async (points: any[], material: string, height: number, length: number) => {
    if (!isAuthenticated) {
      const pendingLine = { projectId: project.id, points, material, height, length };
      localStorage.setItem(`pendingFenceLine_${project.id}`, JSON.stringify(pendingLine));
      setPendingFenceLine(pendingLine);
      setShowSignUpModal(true);
      return;
    }
    try {
      await createLineMutation.mutateAsync({
        projectId: project.id,
        name: `Line ${project.fenceLines ? project.fenceLines.length + 1 : 1}`,
        material,
        height,
        length,
        color: "natural",
        coordinates: points.map((p, idx) => ({
          lat: p.lat,
          lng: p.lng,
          order: idx
        }))
      });
      toast({ title: "Success", description: "Fence line saved." });
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

  return (
    <Layout>
      <SignUpToSaveModal open={showSignUpModal} onOpenChange={setShowSignUpModal} projectId={project.id} />
      <div className="h-[calc(100vh-0rem)] md:h-screen flex flex-col md:flex-row overflow-hidden bg-background">
        
        {/* Left Sidebar - Editor Tools */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-r bg-card z-10 shadow-lg">
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
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {project.fenceLines?.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No fence lines yet.</p>
                      <p className="text-xs opacity-70">Draw on the map to add one.</p>
                    </div>
                  ) : (
                    project.fenceLines?.map((line: any) => (
                      <Card key={line.id} className="group overflow-hidden border-border/60 hover:border-primary/50 transition-colors">
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="details" className="flex-1 p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase">Description</label>
                  <p className="mt-1 p-3 bg-secondary/30 rounded-lg">{project.description || "No description provided."}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        {/* Right Side - Map Area */}
        <div className="flex-1 relative bg-secondary/20">
          <MapEditorComponent 
            onSave={handleSaveLine} 
            isSaving={createLineMutation.isPending}
            initialAddress={project.address}
            initialCenter={[34.0522, -118.2437]}
            existingLines={project.fenceLines}
          />
        </div>
      </div>
    </Layout>
  );
}