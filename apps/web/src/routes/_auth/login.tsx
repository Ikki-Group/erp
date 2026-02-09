import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/providers/ThemeProvider'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      // Simulate auth delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log('Login attempt:', value)

      toast.success('Welcome back!', {
        description: 'Successfully signed in to IKKI ERP.',
      })

      navigate({ to: '/' })
    },
  })

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background font-sans transition-colors duration-500">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent transition-all duration-300"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-primary" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </Button>
      </div>

      {/* Premium Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-secondary/10 dark:bg-secondary/5 blur-[130px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-[100px] animate-bounce-slow" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.1] mix-blend-overlay pointer-events-none" />
      </div>

      <div className="z-10 w-full max-w-[420px] p-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col items-center mb-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/20 dark:shadow-primary/30 ring-1 ring-primary/20 dark:ring-white/10">
              <span className="text-primary-foreground font-black text-2xl tracking-tighter">
                IK
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-foreground leading-none uppercase">
                IKKI ERP
              </span>
              <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase mt-1 opacity-80">
                Enterprise Logic
              </span>
            </div>
          </div>
        </div>

        <Card className="border-border/50 bg-card/30 dark:bg-white/[0.02] backdrop-blur-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all duration-500">
          <CardHeader className="space-y-1.5 pb-6 text-center">
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
              Welcome Experience
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm font-medium">
              Access your centralized ERP management suite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-5"
            >
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    const res = z
                      .string()
                      .email('Invalid business email')
                      .safeParse(value)
                    return res.success ? undefined : res.error.issues[0].message
                  },
                }}
                children={(field) => (
                  <div className="space-y-2.5">
                    <Label
                      htmlFor={field.name}
                      className="text-foreground/80 text-[13px] font-semibold ml-1"
                    >
                      Email Address
                    </Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-all duration-300" />
                      <Input
                        id={field.name}
                        type="email"
                        placeholder="your@company.com"
                        className="h-11 pl-11 bg-background/50 dark:bg-white/[0.02] border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300 rounded-xl"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1 mt-1.5 animate-in slide-in-from-left-1">
                        {field.state.meta.errors.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    const res = z
                      .string()
                      .min(1, 'Security credential required')
                      .safeParse(value)
                    return res.success ? undefined : res.error.issues[0].message
                  },
                }}
                children={(field) => (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label
                        htmlFor={field.name}
                        className="text-foreground/80 text-[13px] font-semibold"
                      >
                        Security Credential
                      </Label>
                    </div>
                    <div className="relative group/input">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-all duration-300" />
                      <Input
                        id={field.name}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="h-11 pl-11 pr-11 bg-background/50 dark:bg-white/[0.02] border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300 rounded-xl"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-accent/50"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-wider ml-1 mt-1.5 animate-in slide-in-from-left-1">
                        {field.state.meta.errors.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              />

              <div className="flex items-center justify-between px-1">
                <Button
                  variant="link"
                  className="px-0 font-medium text-xs text-muted-foreground hover:text-foreground transition-colors h-auto"
                >
                  Forgot Access Key?
                </Button>
                <div className="h-0.5 w-0.5 rounded-full bg-border" />
                <Button
                  variant="link"
                  className="px-0 font-medium text-xs text-primary hover:text-primary/80 transition-colors h-auto"
                >
                  Help Center
                </Button>
              </div>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="w-full mt-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-[0_12px_24px_-8px_rgba(var(--primary),0.3)] dark:shadow-[0_12px_24px_-8px_rgba(var(--primary),0.5)] h-12 rounded-xl text-sm font-bold tracking-tight transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2 text-primary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Identity...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Continue to Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                )}
              />
            </form>
          </CardContent>
          <CardFooter className="pb-8 pt-2 flex justify-center border-t border-border/10">
            <p className="text-[10px] text-muted-foreground/60 font-bold text-center uppercase tracking-[0.2em]">
              Authorized Personnel Only • Session encrypted
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
