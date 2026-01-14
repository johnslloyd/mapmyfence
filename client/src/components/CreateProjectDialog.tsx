import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { useCreateProject } from "@/hooks/use-projects";
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

export function CreateProjectDialog({ 
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
  const { mutateAsync, isPending } = useCreateProject();
  const { toast } = useToast();
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const form = useForm<InsertProject>({
    resolver: zodResolver(
      insertProjectSchema
        .omit({ userId: true })
        .extend({
          name: z.string().min(1, "Project name is required"),
        })
    ),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      status: "planning"
    },
  });

  async function onSubmit(data: InsertProject) {
    toast({ title: 'Creating project', description: 'Starting project creation' });
    try {
      // Convert empty strings to null/undefined for optional fields
      const cleanedData = {
        ...data,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        description: data.description?.trim() || null,
      };
      
      const project = await mutateAsync(cleanedData);
      // if we didn't get an id back, surface an error
      if (!project || !project.id) {
        console.error('Create project did not return an id', project);
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
      console.error('create project error', error);
      // Don't show toast here since useCreateProject already shows one
      // toast({ title: 'Error', description: error?.message || 'Failed to create project', variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create Project</DialogTitle>
          <DialogDescription>
            Start planning your new fence installation.
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
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Backyard Renovation" className="rounded-xl" {...field} />
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
