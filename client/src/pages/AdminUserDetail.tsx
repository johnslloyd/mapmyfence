import { Layout } from "@/components/Layout";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdminUser } from "@/hooks/use-admin";
import { useEffect } from "react";
import { ArrowLeft, Fence, Sprout, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import NotFound from "./not-found";

const PROJECT_TYPE_ICON: Record<string, typeof Fence> = { fence: Fence, lawn_care: Sprout };

// The drill-down from Admin.tsx's user list — same shape a user sees on
// their own /properties (name, address, projects), fetched for someone
// else's id instead of the viewer's own. Read-only, same as the list
// page; see CLAUDE.md's "Admin panel" section.
export default function AdminUserDetail() {
  const [match, params] = useRoute("/admin/users/:id");
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useAdminUser(match ? params?.id : undefined);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (!match) return <NotFound />;

  if (loading || isLoading || !isAuthenticated || !user?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-sm text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!data) return <Layout><NotFound /></Layout>;

  const { user: targetUser, properties } = data;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>

        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 flex-wrap">
            {targetUser.email}
            <Badge variant={targetUser.plan === "pro" ? "default" : "secondary"} className="capitalize">{targetUser.plan}</Badge>
            {targetUser.isAdmin && (
              <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> Admin</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Joined {format(new Date(targetUser.createdAt), "MMMM d, yyyy")}</p>
        </div>

        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Properties ({properties.length})</h2>
          {properties.length === 0 ? (
            <div className="text-sm text-muted-foreground border-2 border-dashed rounded-lg py-10 text-center">
              No properties yet.
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((p: any) => (
                <div key={p.id} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.address || "No address provided"}</div>
                  {p.projects.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {p.projects.map((proj: any) => {
                        const Icon = PROJECT_TYPE_ICON[proj.type] || Fence;
                        return (
                          <div key={proj.id} className="flex items-center gap-2 text-sm bg-secondary/40 rounded-lg px-3 py-2">
                            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium truncate">{proj.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize font-normal ml-auto shrink-0">
                              {proj.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
