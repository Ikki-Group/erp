import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateUser, useUpdateUser, useUser } from "@/features/iam/hooks/iam.hooks";
import { zSchema } from "@/lib/zod";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_auth/iam/users/upsert")({
  component: UserUpsertPage,
  validateSearch: z.object({
    userId: zSchema.numCoerce.optional(),
  }),
});

const userFormSchema = z
  .object({
    username: zSchema.username,
    email: zSchema.email,
    fullname: zSchema.str,
    password: zSchema.password.optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine((data) => {
    // Password is required for new users (we'll handle this check in component logic mainly, but here for safety)
    return true;
  });

type UserFormValues = z.infer<typeof userFormSchema>;

function UserUpsertPage() {
  const { userId } = Route.useSearch();
  const navigate = useNavigate();

  const isEditMode = !!userId;

  const { data: userData, isLoading: isLoadingUser } = useUser(userId || 0);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullname: "",
      password: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (userData?.data) {
      form.reset({
        username: userData.data.username,
        email: userData.data.email,
        fullname: userData.data.fullname,
        isActive: userData.data.isActive,
        password: "", // Don't fill password
      });
    }
  }, [userData, form]);

  async function onSubmit(data: UserFormValues) {
    try {
      if (isEditMode) {
        // For update, only send password if it's not empty
        const updateData: any = {
          id: userId,
          username: data.username,
          email: data.email,
          fullname: data.fullname,
          isActive: data.isActive,
        };
        if (data.password) {
          updateData.password = data.password;
        }
        await updateUserMutation.mutateAsync(updateData);
      } else {
        if (!data.password) {
          form.setError("password", {
            message: "Password is required for new users",
          });
          return;
        }
        await createUserMutation.mutateAsync({
          username: data.username,
          email: data.email,
          fullname: data.fullname,
          isActive: data.isActive,
          password: data.password,
        });
      }
      navigate({ to: "/_auth/iam/users" });
    } catch (error) {
      console.error("Failed to submit user form", error);
    }
  }

  const isLoading = isLoadingUser || createUserMutation.isPending || updateUserMutation.isPending;

  if (isEditMode && isLoadingUser) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/_auth/iam/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditMode ? "Edit User" : "Create User"}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="jdoe" {...field} />
                    </FormControl>
                    <FormDescription>Unique identifier for the user.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? "New Password (Optional)" : "Password"}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isEditMode ? "Leave empty to keep current" : "Secure password"}
                        {...field}
                      />
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>
                        Only enter if you want to change the password.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Account</FormLabel>
                      <FormDescription>Disable to prevent user from logging in.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link to="/_auth/iam/users">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
