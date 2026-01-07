import { Layout } from "@/components/Layout";
import { useRoute } from "wouter";
import { useProject, useCreateFenceLine, useDeleteFenceLine } from "@/hooks/use-projects";
import { MapEditorComponent } from "@/components/MapEditorComponent";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Layers, Map as MapIcon } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import NotFound from "./not-found";

export default function Editor() {
  const [match, params] = useRoute("/editor/:id");
  const projectId = match && params?.id ? parseInt(params.id) : undefined;

  if (projectId === undefined) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center h-full">
          <Card className="max-w-md text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Select a Project</h2>
            <p className="text-muted-foreground mb-6">Please select a project from the dashboard to start editing.</p>
            <Link href="/projects">
              <Button>Go to Projects</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }
  
  if (isNaN(projectId)) {
    return <NotFound />;
  }

  const { data: project, isLoading } = useProject(projectId);
  const createLine = useCreateFenceLine();
  const deleteLine = useDeleteFenceLine();

  if (isLoading) {
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
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Project Not Found</h2>
            <Link href="/projects" className="text-primary hover:underline mt-2 inline-block">
              Return to Projects
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSaveLine = async (points: any[], material: string, height: number, length: number) => {
    try {
      await createLine.mutateAsync({
        projectId: projectId,
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
    } catch (error) {
      console.error("Failed to save line", error);
    }
  };

  const calculateLineLength = (line: any) => {
    // Simple mock calculation logic for display, ideally would be done properly with Haversine
    // For now we just return a placeholder or calculate if we had helper utils ready
    return "Calculated";
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-0rem)] md:h-screen flex flex-col md:flex-row overflow-hidden bg-background">
        
        {/* Left Sidebar - Editor Tools */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-r bg-card z-10 shadow-lg">
          <div className="p-4 border-b">
            <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Projects
            </Link>
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
                                onClick={() => deleteLine.mutate({ id: line.id, projectId })}
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
            isSaving={createLine.isPending}
            initialAddress={project.address}
            initialCenter={[34.0522, -118.2437]}
            existingLines={project.fenceLines}
          />
        </div>
      </div>
    </Layout>
  );
}
