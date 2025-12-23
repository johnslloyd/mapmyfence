import { Layout } from "@/components/Layout";
import { useProjects } from "@/hooks/use-projects";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Link } from "wouter";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.address && p.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Projects</h1>
            <p className="text-muted-foreground">Manage and track all your fence installations.</p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Filters */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects by name or address..." 
            className="pl-10 rounded-xl bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project: any) => (
              <Link key={project.id} href={`/editor/${project.id}`}>
                <div className="group bg-card hover:bg-card/50 rounded-2xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col relative overflow-hidden">
                  {/* Status Indicator */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider ${
                    project.status === 'completed' ? 'bg-green-100 text-green-700' :
                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </div>

                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                      {project.address || "No address provided"}
                    </p>
                  </div>

                  {project.description && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 flex-1">
                      {project.description}
                    </p>
                  )}

                  <div className="pt-4 mt-auto border-t flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                    {/* Placeholder for number of lines - would need relation count */}
                    <span>View Details &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-3xl border border-dashed">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No projects found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Try adjusting your search or create a new project to get started.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
