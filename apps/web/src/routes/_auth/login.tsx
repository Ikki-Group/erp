import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2Icon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CommandIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/features/iam";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative flex-1 grid-cols-1 grid lg:grid-cols-2 lg:px-0 bg-background">
      <BrandingSection />
      <LoginForm />
    </div>
  );
}

function BrandingSection() {
  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-black" />

      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-blue-600 blur-[120px]" />
      </div>

      <div className="relative z-20 flex items-center text-lg font-medium">
        <div className="rounded-lg bg-white/10 p-2 mr-2 backdrop-blur-sm border border-white/10">
          <CommandIcon className="h-6 w-6" />
        </div>
        IKKI ERP
      </div>

      <div className="relative z-20 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;Platform manajemen enterprise yang mengintegrasikan seluruh operasional bisnis
            Anda dalam satu dashboard yang intuitif dan efisien.&rdquo;
          </p>
          <footer className="text-sm text-zinc-400">Department IT & Operasional</footer>
        </blockquote>
      </div>
    </div>
  );
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login.mutationFn,
    onSuccess: () =>
      toast.success("Login Berhasil", {
        description: "Selamat datang kembali di IKKI ERP.",
        icon: <CheckCircle2Icon className="text-green-600" />,
      }),
    onError: () =>
      toast.error("Login Gagal", {
        description: "Silakan periksa kembali email dan password Anda.",
      }),
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const res = await loginMutation.mutateAsync({
        body: {
          identifier: value.email,
          password: value.password,
        },
      });
      useAuth.getState().setToken(res.data.token);
    },
  });

  return (
    <div className="lg:p-8 p-4 relative flex items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email dan password Anda untuk masuk
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                const res = z.email("Email tidak valid").safeParse(value);
                return res.success ? undefined : res.error.issues[0].message;
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    placeholder="nama@perusahaan.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </InputGroup>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[10px] text-destructive font-medium animate-in slide-in-from-left-1">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                const res = z.string().min(1, "Password diperlukan").safeParse(value);
                return res.success ? undefined : res.error.issues[0].message;
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Password</Label>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-primary"
                    type="button"
                    onClick={() =>
                      toast.info("Info", {
                        description: "Silakan hubungi administrator untuk reset password.",
                      })
                    }
                  >
                    Lupa password?
                  </Button>
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <LockIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="current-password"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton onClick={() => setShowPassword(!showPassword)} size="icon-xs">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[10px] text-destructive font-medium animate-in slide-in-from-left-1">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full h-10 font-medium"
              >
                {isSubmitting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Memproses..." : "Masuk"}
              </Button>
            )}
          />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Atau</span>
          </div>
        </div>

        <div className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Belum punya akun?{" "}
            <Button
              variant="link"
              className="underline underline-offset-4 hover:text-primary p-0 h-auto"
              onClick={() =>
                toast.info("Info", {
                  description: "Hubungi administrator sistem untuk pembuatan akun baru.",
                })
              }
            >
              Hubungi Admin
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
