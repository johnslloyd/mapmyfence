import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPropertySchema, type InsertProperty } from "@shared/schema";
import { useCreateProperty } from "@/hooks/use-projects";
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
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

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

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

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
    toast({ title: 'Creating property', description: 'Starting property creation' });
    try {
      // Convert empty strings to null/undefined for optional fields
      const cleanedData = {
        ...data,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        description: data.description?.trim() || null,
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
      </DialogContent>
    </Dialog>
  );
}
