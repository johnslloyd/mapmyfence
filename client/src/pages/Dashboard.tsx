import { Layout } from "@/components/Layout";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  MapPin, 
  Ruler, 
  DollarSign, 
  CalendarDays,
  Hammer,
  Layout as FolderKanban,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
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

function HeroIllustration() {
  return (
    <svg width="520" height="440" viewBox="0 0 520 440" fill="none" className="w-full max-w-[480px] h-auto">
      <rect x="0" y="0" width="520" height="440" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
      <g stroke="hsl(var(--border))" strokeWidth="1">
        <line x1="24" y1="24" x2="24" y2="416"/><line x1="90" y1="24" x2="90" y2="416"/><line x1="156" y1="24" x2="156" y2="416"/><line x1="222" y1="24" x2="222" y2="416"/><line x1="288" y1="24" x2="288" y2="416"/><line x1="354" y1="24" x2="354" y2="416"/><line x1="420" y1="24" x2="420" y2="416"/><line x1="486" y1="24" x2="486" y2="416"/>
        <line x1="24" y1="24" x2="496" y2="24"/><line x1="24" y1="90" x2="496" y2="90"/><line x1="24" y1="156" x2="496" y2="156"/><line x1="24" y1="222" x2="496" y2="222"/><line x1="24" y1="288" x2="496" y2="288"/><line x1="24" y1="354" x2="496" y2="354"/><line x1="24" y1="416" x2="496" y2="416"/>
      </g>
      <rect x="200" y="130" width="140" height="100" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.4"/>
      <path d="M60 80 L60 380 L460 380 L460 110" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" fill="none"/>
      <circle cx="60" cy="80" r="5" fill="hsl(var(--primary))"/>
      <circle cx="60" cy="230" r="5" fill="hsl(var(--primary))"/>
      <circle cx="60" cy="380" r="5" fill="hsl(var(--primary))"/>
      <circle cx="260" cy="380" r="5" fill="hsl(var(--primary))"/>
      <circle cx="460" cy="380" r="5" fill="hsl(var(--primary))"/>
      <circle cx="460" cy="110" r="5" fill="hsl(var(--primary))"/>
      <text x="34" y="160" fontFamily="var(--font-mono)" fontSize="11" fill="hsl(var(--muted-foreground))" transform="rotate(-90 34 160)">150.0 ft</text>
      <text x="260" y="400" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="hsl(var(--muted-foreground))">400.0 ft</text>
      <rect x="130" y="368" width="76" height="24" rx="4" fill="hsl(var(--accent))" stroke="hsl(var(--primary))" strokeWidth="1"/>
      <text x="168" y="384" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="500" fill="hsl(var(--primary))">64.5 ft</text>
    </svg>
  );
}

function UnauthenticatedDashboard() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const primaryCta = (
    <CreateProjectDialog>
      <Button className="h-[52px] px-7 text-base font-semibold">Start planning — it's free</Button>
    </CreateProjectDialog>
  );

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto">

        {/* HERO */}
        <div className="flex flex-col lg:flex-row items-center gap-14 px-6 md:px-12 py-20 md:py-24">
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <div className="font-mono text-xs text-primary mb-5 tracking-wide">
              &gt; FREE_TO_START · NO_ACCOUNT_REQUIRED
            </div>
            <h1 className="font-display font-semibold text-4xl md:text-5xl leading-tight tracking-tight mb-6">
              Measure your yard like a pro, before you touch a shovel.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
              Trace your fence line on real satellite imagery down to the foot, and get an exact material count and cost — pulled from real retailer pricing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {primaryCta}
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-[52px] px-6 text-base font-semibold gap-2">
                    Log in <ArrowRight className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <LoginModal onLoginSuccess={() => setIsLoginOpen(false)} />
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Don't have an account? <Link href="/register" className="underline hover:text-primary">Sign up</Link>
            </p>
          </div>
          <div className="flex-1 min-w-0 flex justify-center">
            <HeroIllustration />
          </div>
        </div>

        {/* VALUE PROPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          <div className="bg-secondary/40 p-9 flex flex-col gap-3.5">
            <span className="font-mono text-xs text-primary">01</span>
            <h3 className="font-display font-semibold text-lg">Real satellite imagery</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">See your actual property — driveway, trees, structures — not a rough sketch.</p>
          </div>
          <div className="bg-secondary/40 p-9 flex flex-col gap-3.5">
            <span className="font-mono text-xs text-primary">02</span>
            <h3 className="font-display font-semibold text-lg">Real material pricing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Costs pulled from actual hardware store listings, down to the post and bag of concrete.</p>
          </div>
          <div className="bg-secondary/40 p-9 flex flex-col gap-3.5">
            <span className="font-mono text-xs text-primary">03</span>
            <h3 className="font-display font-semibold text-lg">No commitment to start</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Plan as a guest. Create an account only when you're ready to save.</p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="px-6 md:px-12 py-24">
          <h2 className="font-display font-semibold text-3xl text-center tracking-tight mb-16">Three steps. No spreadsheet.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border max-w-4xl mx-auto">
            <div className="bg-background p-8 flex flex-col gap-4">
              <div className="font-mono text-xs text-primary">STEP_01</div>
              <h3 className="font-display font-semibold text-lg">Find your property</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Search your address — we center a real satellite view of your yard.</p>
            </div>
            <div className="bg-background p-8 flex flex-col gap-4">
              <div className="font-mono text-xs text-primary">STEP_02</div>
              <h3 className="font-display font-semibold text-lg">Draw your fence line</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Click points along the line — length calculates as you go.</p>
            </div>
            <div className="bg-background p-8 flex flex-col gap-4">
              <div className="font-mono text-xs text-primary">STEP_03</div>
              <h3 className="font-display font-semibold text-lg">Get your estimate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">A full materials list and total cost, sourced from real store pricing.</p>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="bg-card border-t border-border px-6 py-20 text-center">
          <h2 className="font-display font-semibold text-3xl tracking-tight mb-4">Ready to see your yard on the map?</h2>
          <p className="text-muted-foreground mb-8">Two minutes. No account required to try it.</p>
          <div className="flex justify-center">{primaryCta}</div>
        </div>

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
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {/* Recent Projects */}
        <div className="space-y-6">
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
                </CardContent>
              </Card>
            )}
        </div>
        <div className="flex justify-start mt-8">
            <CreateProjectDialog />
        </div>
      </div>
    </Layout>
  );
}
