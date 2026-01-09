import { Layout } from "@/components/Layout";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  MapPin, 
  Ruler, 
  DollarSign, 
  CalendarDays,
  Hammer,
  Layout as FolderKanban
} from "lucide-react";
import { Link } from "wouter";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { LoginModal } from "@/components/LoginModal";

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function UnauthenticatedDashboard() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8">
        <h1 className="text-4xl font-display font-bold mb-4">Welcome to MapMyFence</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          The ultimate tool for planning and estimating your fencing projects with precision. Map out your fence lines, choose materials, and get instant cost estimates.
        </p>
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Log In to Get Started</Button>
          </DialogTrigger>
          <LoginModal onLoginSuccess={() => setIsLoginOpen(false)} />
        </Dialog>
        <p className="text-sm text-muted-foreground mt-4">
          Don't have an account? <Link href="/register"><a className="underline hover:text-primary">Sign up</a></Link>
        </p>
      </div>
    </Layout>
  );
}

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects({ enabled: isAuthenticated });

  if (authLoading) {
    return (
      <Layout>
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedDashboard />;
  }

  const isLoading = projectsLoading;

  // Mock stats aggregation
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter((p: any) => p.status === 'in-progress' || p.status === 'planning').length || 0;
  
  // In a real app, calculate total footage from all lines in all projects
  // Mocking it here as we don't fetch full details in the list view typically
  const totalFootage = 1250; 

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your project overview.</p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Projects" 
            value={totalProjects} 
            icon={CalendarDays}
            description="All time projects"
          />
          <StatCard 
            title="Active Jobs" 
            value={activeProjects} 
            icon={Hammer}
            description="Currently in progress"
          />
          <StatCard 
            title="Total Footage" 
            value={`${totalFootage} ft`} 
            icon={Ruler}
            description="Mapped fence lines"
          />
          <StatCard 
            title="Est. Revenue" 
            value="$45,200" 
            icon={DollarSign}
            description="Based on material costs"
          />
        </div>

        {/* Recent Projects */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Recent Projects</h2>
              <Link href="/projects">
                <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid gap-4">
                {projects.slice(0, 3).map((project: any) => (
                  <Link key={project.id} href={`/editor/${project.id}`}>
                    <div className="group bg-card rounded-xl p-4 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <MapPin className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{project.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{project.address || "No address provided"}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          project.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          project.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {project.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-secondary/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <FolderKanban className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-lg">No projects yet</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Create your first project to start planning fence lines and estimating costs.
                  </p>
                  <CreateProjectDialog />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel Info */}
          <div className="space-y-6">
             <Card className="bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground border-none shadow-xl">
               <CardHeader>
                 <CardTitle className="font-display">Quick Actions</CardTitle>
                 <CardDescription className="text-primary-foreground/80">
                   Common tasks to get you started
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-3">
                 <CreateProjectDialog>
                   <Button variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white">
                     <Hammer className="w-4 h-4" /> Start New Quote
                   </Button>
                 </CreateProjectDialog>
                 <Link href="/projects">
                   <Button variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white">
                     <FolderKanban className="w-4 h-4" /> Browse Archives
                   </Button>
                 </Link>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Material Prices</CardTitle>
                 <CardDescription>Current market estimates (per ft)</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="font-medium">Cedar Wood</span>
                   <span className="font-mono text-muted-foreground">$24.50</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="font-medium">Vinyl (White)</span>
                   <span className="font-mono text-muted-foreground">$32.00</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="font-medium">Chain Link</span>
                   <span className="font-mono text-muted-foreground">$14.75</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="font-medium">Wrought Iron</span>
                   <span className="font-mono text-muted-foreground">$45.00</span>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
