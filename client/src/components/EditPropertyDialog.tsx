import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty } from "@shared/schema";
import { useUpdateProperty } from "@/hooks/use-projects";
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
import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";

// Renamed from EditProjectDialog in the Property/Project restructure —
// name/address/description all live on the property now, not a project.
// Not currently wired up to a trigger anywhere (same as before the
// rename) — kept working and up to date in case it gets connected later,
// see CLAUDE.md's "Known dead files" notes for the pattern.
export function EditPropertyDialog({
  property,
  children,
}: {
  property: any,
  children?: React.ReactNode,
}) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useUpdateProperty();

  const form = useForm<Partial<InsertProperty>>({
    resolver: zodResolver(insertPropertySchema.partial()),
    defaultValues: {
      name: property.name,
      address: property.address || "",
      description: property.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: property.name,
      address: property.address || "",
      description: property.description || "",
    });
  }, [property, form]);

  async function onSubmit(data: Partial<InsertProperty>) {
    try {
      await mutateAsync({ id: property.id, ...data });
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Edit Property</DialogTitle>
          <DialogDescription>
            Update your property details and notes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                className="rounded-xl"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
