import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPropertySchema, type InsertProperty } from "@shared/schema";
import { FREE_PROPERTY_LIMIT } from "@shared/routes";
import { useCreateProperty, useProperties, useUpgradeToPro } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, LocateFixed, Loader2, CheckCircle2, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// Builds a normal one-line US address ("123 Main St, Jackson, MS 39201")
// from Nominatim's reverse-geocode `address` parts — its `display_name`
// is a long county/country string nobody would type. Returns null when
// there isn't even a street to name.
const STATE_ABBR: Record<string, string> = { Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC" };
function formatReverseAddress(a: Record<string, string> | undefined): string | null {
  if (!a?.road) return null;
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = a.city || a.town || a.village || a.hamlet || a.suburb;
  const stateZip = [a.state ? STATE_ABBR[a.state] ?? a.state : null, a.postcode].filter(Boolean).join(" ");
  return [street, city, stateZip].filter(Boolean).join(", ");
}

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "located"; lat: number; lng: number; accuracy: number }
  | { status: "error"; message: string };

// Renamed from CreateProjectDialog in the Property/Project restructure
// (see CLAUDE.md). This creates a PROPERTY (just an address — no type,
// no status). The server auto-creates that property's first project
// (type: fence) in the same request, so this dialog still lands the
// user straight in the fence editor — zero added friction versus the
// old flow, even though a property can now hold multiple projects.
export function AddPropertyDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: {
  children?: React.ReactNode,
  open?: boolean,
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { mutateAsync, isPending } = useCreateProperty();
  const { toast } = useToast();
  const { isAuthenticated, user, login } = useAuth();
  // Guests never hit this — the limit is only meaningful once a
  // property is actually tied to an account (see FREE_PROPERTY_LIMIT's
  // own comment). Only fetches when authenticated, same reasoning as
  // Layout.tsx's nav.
  const { data: properties } = useProperties({ enabled: isAuthenticated });
  const upgrade = useUpgradeToPro();
  // isPro, not a raw plan check — a business's members are Pro
  // automatically while on the roster (2026-09-10), not just
  // personally-approved accounts. See server/auth.ts's isEffectivelyPro.
  const isAtLimit = isAuthenticated && !user?.isPro && (properties?.length ?? 0) >= FREE_PROPERTY_LIMIT;
  const isProRequestPending = isAuthenticated && user?.plan !== "pro" && !!user?.planRequestedAt;

  // "Use my location" (2026-10-16) — the browser's own Geolocation API,
  // no vendor or key. Lets someone standing in their yard skip address
  // search entirely, which is where real users kept getting stuck
  // (Nominatim often lacks house-level data — see CLAUDE.md). The
  // coordinates are saved on the property so the editor opens right
  // there. Primary on mobile (phones have GPS, and are usually what
  // someone has in hand in the yard); secondary on desktop, where the
  // browser estimates from Wi-Fi and can be off by a block.
  const isMobile = useIsMobile();
  const canGeolocate = typeof navigator !== "undefined" && "geolocation" in navigator;
  const [location, setLocationState] = useState<LocationState>({ status: "idle" });

  const handleUseMyLocation = () => {
    setLocationState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setLocationState({ status: "located", lat, lng, accuracy });
        // Pre-fill the address so the property still has a readable name
        // everywhere else in the app — but only if they haven't typed
        // one already. Best-effort: the coordinates are what the editor
        // actually uses, so a missing/imperfect address is fine.
        if (form.getValues("address")?.trim()) return;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const formatted = formatReverseAddress(data?.address);
          if (formatted && !form.getValues("address")?.trim()) {
            form.setValue("address", formatted, { shouldDirty: true });
          }
        } catch {
          // Ignore — they can type it, and the location is already saved.
        }
      },
      (err) => {
        setLocationState({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location access is turned off for this site. Enter the address below instead."
              : "We couldn't get your location. Enter the address below instead.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const handleUpgrade = async () => {
    try {
      const data = await upgrade.mutateAsync();
      login({ ...user, plan: data.plan, planRequestedAt: data.planRequestedAt });
      // Unlike the old instant self-serve flip, this does NOT clear
      // isAtLimit — a request isn't a grant. The dialog stays open and
      // isProRequestPending's branch below takes over in place, same
      // "no reason to make them reopen it" reasoning as before, just
      // landing on a waiting message instead of the create form.
    } catch {
      // useUpgradeToPro already toasts the error.
    }
  };

  const form = useForm<InsertProperty>({
    resolver: zodResolver(
      insertPropertySchema
        .omit({ userId: true })
        .extend({
          name: z.string().min(1, "Property name is required"),
        })
    ),
    defaultValues: {
      name: "",
      address: "",
      description: "",
    },
  });

  async function onSubmit(data: InsertProperty) {
    // A "Creating property / Starting property creation" toast used to
    // fire right here, before the request even resolved — the ONE place
    // in the app announcing an action was STARTING rather than that it
    // SUCCEEDED (every other toast fires once, from a mutation's own
    // onSuccess). Removed (2026-09-14, direct feedback: on mobile, this
    // stacked with useCreateProperty's own real "Property created
    // successfully" toast a moment later — ToastViewport is `fixed
    // top-0 w-full` below the `sm:` breakpoint, so two toasts there
    // means two full-width green banners covering the header at once,
    // reading as "the banner won't go away"). The real confirmation
    // already exists — see useCreateProperty's onSuccess — this one
    // added a false sense of a slow, multi-step process for a request
    // that resolves in well under a second.
    try {
      // Convert empty strings to null/undefined for optional fields
      const cleanedData = {
        ...data,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        description: data.description?.trim() || null,
        latitude: location.status === "located" ? location.lat : null,
        longitude: location.status === "located" ? location.lng : null,
      };

      const property = await mutateAsync(cleanedData);
      const project = property?.projects?.[0];
      if (!property || !project) {
        console.error('Create property did not return a project to land on', property);
        toast({ title: 'Error', description: 'Server did not return a project id', variant: 'destructive' });
        return;
      }
      // Save the anonymous project to local storage
      localStorage.setItem('anonymousProjectId', project.id.toString());
      // Navigate to the editor in guest mode
      setLocation(`/editor/${project.id}?guest=true`);
      setOpen(false);
      form.reset();
      setLocationState({ status: "idle" });
    } catch (error: any) {
      console.error('create property error', error);
      // Don't show toast here since useCreateProperty already shows one
      // toast({ title: 'Error', description: error?.message || 'Failed to create property', variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add a Property
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl">
        {isAtLimit ? (
          // Checked BEFORE the create form ever renders, not after a
          // submission gets rejected — the old flow let someone fill
          // out the whole form and only found out it was pointless on
          // submit. See CLAUDE.md's "Account tiers" section.
          isProRequestPending ? (
            // Already requested — a second click here would just spam
            // admins with duplicate notifications for nothing. This
            // replaces the old "upgrade morphs the dialog into the
            // create form in place" behavior, since a REQUEST isn't a
            // grant — there's no form to reveal yet.
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Request pending
                </DialogTitle>
                <DialogDescription>
                  Your Pro access request is with an admin for review. You'll be able to add more properties as soon as it's approved.
                </DialogDescription>
              </DialogHeader>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> You're at the free limit
                </DialogTitle>
                <DialogDescription>
                  Free accounts can have up to {FREE_PROPERTY_LIMIT} properties. Request Pro for unlimited — no payment info needed, it's free while PostPlotter is in beta. An admin reviews each request.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end pt-4">
                <Button onClick={handleUpgrade} disabled={upgrade.isPending} className="rounded-xl w-full sm:w-auto gap-2">
                  <Sparkles className="w-4 h-4" /> {upgrade.isPending ? "Sending request..." : "Request Pro access"}
                </Button>
              </div>
            </>
          )
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Add a Property</DialogTitle>
          <DialogDescription>
            Start planning your yard — fencing, lawn care, and more.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-2 bg-destructive/10 text-destructive rounded-md">
                {Object.entries(form.formState.errors).map(([k, v]) => (
                  <div key={k} className="text-sm">{k}: {(v as any).message}</div>
                ))}
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Backyard" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canGeolocate && (
              location.status === "located" ? (
                <div className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div className="flex-1">
                    <p className="font-medium">Using your current location</p>
                    <p className="text-xs text-muted-foreground">
                      {location.accuracy > 100
                        ? `This is approximate (within about ${Math.round(location.accuracy * 3.28084).toLocaleString()} ft), so you may need to drag the map to your yard.`
                        : "The map will open right on this spot."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationState({ status: "idle" })}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Don't use my location"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant={isMobile ? "default" : "outline"}
                    onClick={handleUseMyLocation}
                    disabled={location.status === "locating"}
                    className={cn("w-full gap-2 rounded-xl", isMobile && "h-12")}
                  >
                    {location.status === "locating" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Finding your location...</>
                    ) : (
                      <><LocateFixed className="h-4 w-4" /> I'm at the property — use my location</>
                    )}
                  </Button>
                  {location.status === "error" ? (
                    <p className="text-xs text-destructive">{location.message}</p>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">or enter the address below</p>
                  )}
                </div>
              )
            )}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Maple Ave" className="rounded-xl" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific requirements..."
                      className="resize-none rounded-xl"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl w-full sm:w-auto"
                onClick={() => {
                  form.handleSubmit(onSubmit)();
                }}
              >
                {isPending ? "Creating..." : "Start Planning"}
              </Button>
            </div>
          </form>
        </Form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
