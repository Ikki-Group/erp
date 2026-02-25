import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Package, ArrowLeft, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_auth/products/upsert")({
  component: ProductUpsertPage,
  staticData: {
    breadcrumb: "Add/Edit Product",
  },
});

function ProductUpsertPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      stock: 0,
      status: "draft" as "active" | "archived" | "draft",
      description: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      // Simulate async API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Form submitted:", value);

      toast.success("Product saved successfully", {
        description: `${value.name} has been updated in the inventory.`,
      });

      setIsSubmitting(false);
      navigate({ to: "/products" });
    },
  });

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Details</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the information below to update your inventory.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="grid gap-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                General Information
              </CardTitle>
              <CardDescription>Essential details about your product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const res = z
                      .string()
                      .min(2, "Name must be at least 2 characters")
                      .safeParse(value);
                    return res.success ? undefined : res.error.issues[0].message;
                  },
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Product Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Espresso Roast"
                      className={field.state.meta.errors.length ? "border-destructive" : ""}
                    />
                    {field.state.meta.errors ? (
                      <em className="text-[10px] text-destructive font-medium uppercase tracking-wider not-italic">
                        {field.state.meta.errors.join(", ")}
                      </em>
                    ) : null}
                  </div>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="category"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z.string().min(1, "Category is required").safeParse(value);
                      return res.success ? undefined : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Category</Label>
                      <Select value={field.state.value} onValueChange={field.handleChange}>
                        <SelectTrigger
                          className={field.state.meta.errors.length ? "border-destructive" : ""}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Coffee">Coffee</SelectItem>
                          <SelectItem value="Supplies">Supplies</SelectItem>
                          <SelectItem value="Packaging">Packaging</SelectItem>
                          <SelectItem value="Dairy">Dairy</SelectItem>
                          <SelectItem value="Merchandise">Merchandise</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors ? (
                        <em className="text-[10px] text-destructive font-medium uppercase tracking-wider not-italic">
                          {field.state.meta.errors.join(", ")}
                        </em>
                      ) : null}
                    </div>
                  )}
                />

                <form.Field
                  name="status"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Status</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>

              <Separator className="my-4 opacity-50" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="price"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z.number().positive("Price must be positive").safeParse(value);
                      return res.success ? undefined : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Retail Price ($)</Label>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        placeholder="0.00"
                        className={field.state.meta.errors.length ? "border-destructive" : ""}
                      />
                      {field.state.meta.errors ? (
                        <em className="text-[10px] text-destructive font-medium uppercase tracking-wider not-italic">
                          {field.state.meta.errors.join(", ")}
                        </em>
                      ) : null}
                    </div>
                  )}
                />

                <form.Field
                  name="stock"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .number()
                        .int()
                        .nonnegative("Stock cannot be negative")
                        .safeParse(value);
                      return res.success ? undefined : res.error.issues[0].message;
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Current Stock</Label>
                      <Input
                        id={field.name}
                        type="number"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        placeholder="0"
                        className={field.state.meta.errors.length ? "border-destructive" : ""}
                      />
                      {field.state.meta.errors ? (
                        <em className="text-[10px] text-destructive font-medium uppercase tracking-wider not-italic">
                          {field.state.meta.errors.join(", ")}
                        </em>
                      ) : null}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/products" })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="min-w-[120px] shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Product
                    </>
                  )}
                </Button>
              )}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
