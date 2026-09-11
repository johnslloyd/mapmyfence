import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProject } from "@/hooks/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";
import { Layout } from "@/components/Layout";
import { MapEditorComponent } from "@/components/MapEditorComponent";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";
import { useEffect } from "react";

// Admin panel (2026-09-11) — a direct follow-up to QuotePlanView.tsx's
// real read-only map: the same request, but for the admin's OWN
// activity feed ("when I see someone mapped a fence, let me click
// through to see it"), not a customer's quote link. Reuses the exact
// same GET /api/admin/projects/:id (`useAdminProject`) AdminUserDetail's
// own project dialog already fetches — same data shape, just rendered
// as a real interactive map here instead of the small abstract
// PlanThumbnail there. See QuotePlanView.tsx's own comment for why no
// stripped-down clone of MapEditorComponent is needed: `editingLine=
// {null}` + no mutation callbacks already makes it correctly inert,
// and `readOnly` only changes one status-bar string.
//
// Unlike the public, no-login quote view, this is authenticated and
// wrapped in the real `Layout` (nav included) — an admin should be
// able to get back to the rest of the admin panel normally, not land
// on an isolated page with no way out but the browser's back button.
export default function AdminProjectMapView() {
  const [, params] = useRoute("/admin/projects/:id/map");
  const projectId = params?.id ? parseInt(params.id) : undefined;
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useAdminProject(projectId);
  const isMobile = useIsMobile();

  // Same self-enforced auth+isAdmin pattern as Admin.tsx/
  // AdminUserDetail.tsx — ProtectedRoute is a no-op passthrough; the
  // real gate is server-side (isAdmin middleware on the route this
  // page's own data fetch hits).
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading || !isAuthenticated || !user?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-4 md:p-8 text-sm text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  const project = data?.project;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-4 md:p-8 text-sm text-muted-foreground">Loading map...</div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-4 md:p-8 text-sm text-muted-foreground">Project not found.</div>
      </Layout>
    );
  }

  const totalLength = project.fenceLines?.reduce((sum: number, l: any) => sum + (l.length || 0), 0) || 0;
  const gateCount = project.fenceLines?.reduce((sum: number, l: any) => sum + (l.gates?.length || 0), 0) || 0;

  return (
    <Layout>
      <div className="flex h-full relative overflow-hidden">
        <div className="flex-1 relative h-full min-w-0 bg-secondary/20">
          <MapEditorComponent
            initialCenter={undefined}
            initialAddress={project.property?.address ?? undefined}
            onSave={() => {}}
            isSaving={false}
            existingLines={project.fenceLines || []}
            isMobile={isMobile}
            selectedLineId={null}
            editingLine={null}
            isDrawing={false}
            controlsPosition="right"
            placingGateType={null}
            isPro={false}
            readOnly
          />
          <div className="absolute top-4 right-4 z-30">
            <Card className="bg-panel/95 backdrop-blur shadow-xl border-border/50 rounded-lg py-2 px-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <Badge variant="outline" className="gap-1 text-[10px] h-5 font-normal">
                  <Eye className="w-3 h-3" /> Admin view only
                </Badge>
                {project.property?.userId && (
                  <Link href={`/admin/users/${project.property.userId}`} className="text-[10px] text-primary hover:underline">
                    View account
                  </Link>
                )}
              </div>
              <div className="text-sm font-medium">{project.name}</div>
              <div className="text-xs text-muted-foreground">{project.property?.address || "No address provided"}</div>
              <div className="flex gap-4 text-sm mt-1.5">
                <div>
                  <span className="font-mono font-medium">{totalLength.toFixed(0)} ft</span>
                  <span className="text-xs text-muted-foreground ml-1">total</span>
                </div>
                <div>
                  <span className="font-mono font-medium">{gateCount}</span>
                  <span className="text-xs text-muted-foreground ml-1">{gateCount === 1 ? "gate" : "gates"}</span>
                </div>
              </div>
            </Card>
          </div>
          <div className="absolute top-4 left-4 z-30">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm bg-panel/95 backdrop-blur shadow-xl border border-border/50 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
