import { Link, useLocation } from "wouter";
import { LandPlot, FolderKanban, Menu, X, LogOut, User as UserIcon, Sparkles, Shield } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AddPropertyDialog } from "./AddPropertyDialog";
import { PageHeader } from "./PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { useProperties } from "@/hooks/use-projects";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { LoginModal } from "./LoginModal";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  // Only fetches when authenticated — the endpoint 401s for guests, and
  // there'd be nothing to show them here anyway.
  const { data: properties } = useProperties({ enabled: isAuthenticated });

  const closeLoginModal = () => setLoginModalOpen(false);

  // "Dashboard" (-> "/") used to be a distinct authenticated view; now
  // that Dashboard.tsx just redirects logged-in users straight to
  // /properties (see CLAUDE.md), a nav link to it was a pointless bounce.
  // The logo already links home for guests, so nothing lost by dropping it.
  //
  // Property-count-aware nav (2026-08-30): a full "My Properties" grid
  // page is overkill for the common case (one property) — most users
  // never need to search/switch between yards, they just want back into
  // THE yard. So the single nav slot adapts to how many properties this
  // user actually has, rather than always pointing at the list:
  //   0 properties — nothing to show yet (they'd use "Add a Property").
  //   1 property   — the property's own name, linking straight to it.
  //   2+ properties — "My Properties", linking to the searchable grid,
  //                    which only earns its keep once there's something
  //                    to actually search/switch between.
  const propertyCount = properties?.length ?? 0;
  const navigation =
    propertyCount === 1
      ? [{ name: properties![0].name, href: `/properties/${properties![0].id}`, icon: FolderKanban }]
      : propertyCount > 1
        ? [{ name: 'My Properties', href: '/properties', icon: FolderKanban }]
        : [];

  const isActive = (href: string) => {
    return location === href;
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <div className="h-screen bg-secondary/30 flex flex-col overflow-hidden">
      {/* Header — shell (border/blur/height/width-cap) lives in
          PageHeader.tsx, shared with AuthLayout.tsx, so the two can't
          drift out of alignment with each other again (see CLAUDE.md's
          "Page width/padding consistency pass"). */}
      <PageHeader
        below={
          mobileMenuOpen && (
            <div className="md:hidden border-t">
              <nav className="grid gap-2 p-4 text-lg font-medium">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-lg px-3 py-2 transition-all hover:text-foreground",
                      isActive(item.href) ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )
        }
      >
          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <LandPlot className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl hidden sm:inline-block">MyYardManager</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center gap-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground",
                  isActive(item.href) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-4">
            {/* Add Property Button */}
            <AddPropertyDialog />

            {/* User Menu / Login */}
            {isAuthenticated ? (
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                    </Avatar>
                    {/* Pro badge — a small always-visible plan indicator,
                        not just something you discover on the Account
                        page. A plain "P" glyph, not an icon — per direct
                        feedback on the Sparkles version this replaced;
                        the dropdown's own "Pro" Badge right below keeps
                        Sparkles since it sits next to the actual word
                        "Pro" there, not standing in for it alone. */}
                    {user?.plan === "pro" && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary ring-2 ring-card"
                        title="Pro"
                      >
                        <span className="text-[9px] font-bold leading-none text-primary-foreground">P</span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium leading-none">My Account</p>
                        {user?.plan === "pro" && (
                          <Badge variant="default" className="h-4 px-1.5 text-[10px] font-normal gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Pro
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
                <DialogTrigger asChild>
                  <Button>Login</Button>
                </DialogTrigger>
                <LoginModal onLoginSuccess={closeLoginModal} />
              </Dialog>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
      </PageHeader>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}