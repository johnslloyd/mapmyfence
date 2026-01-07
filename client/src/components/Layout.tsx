import { Link, useLocation } from "wouter";
import { LayoutDashboard, Map, Settings, FolderKanban, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'Map Editor', href: '/editor', icon: Map, matchStart: true },
  ];

  const isActive = (href: string, matchStart = false) => {
    if (href === '/' && location !== '/') return false;
    if (matchStart) return location.startsWith(href);
    return location === href;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">MapMyFence</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-lg shadow-primary/20">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight leading-none">MapMyFence</h1>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Professional Planning</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer font-medium text-sm group",
                  isActive(item.href, item.matchStart)
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive(item.href, item.matchStart) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          {isAuthenticated ? (
            <div>
              <p className="text-sm font-medium px-4">{user?.email}</p>
              <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">Logout</Button>
            </div>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
          )}
          <CreateProjectDialog />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background/50 relative">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        
        {children}
      </main>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
