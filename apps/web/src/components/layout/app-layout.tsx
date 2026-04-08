import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { Suspense, useMemo } from 'react'

import { IkkiLogo } from '@/components/blocks/brand/logo'
import { ThemeSwitcher } from '@/components/providers/theme'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { getAppMenu } from '@/config/app-menu'
import { UserSection } from '@/features/iam/components/user-section'
import { useAppState } from '@/hooks/use-app-state'
import { cn } from '@/lib/utils'

import { LoadingPage } from '@/components/blocks/feedback/loading-page'
import { Breadcrumbs } from './breadcrumbs'
import { Separator } from '../ui/separator'
import { LocationSwitcher } from '@/features/location/components/location-switcher'

export function AppLayout() {
  const { setSidebarOpen, sidebarOpen } = useAppState()

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar>
        <SidebarHeader className="border-b h-16">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link to="/" />}>
                <IkkiLogo />
                <div className="grid flex-1 text-left text-sm leading-tight gap-0.5">
                  <span className="truncate font-semibold">Ikki Management</span>
                  <span className="truncate text-xs">Backoffice</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenus />
        </SidebarContent>
        <SidebarFooter>
          <UserSection />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background-secondary/30">
        <Header />
        <Suspense fallback={<LoadingPage />}>
          <main className="flex flex-1 flex-col h-full overflow-hidden @container animate-enter">
            <Outlet />
          </main>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}

function SidebarMenus() {
  const { pathname } = useLocation()

  const groups = useMemo(() => getAppMenu(pathname), [pathname])

  return (
    <div className="px-2 py-4">
      {groups.map((group, groupIdx) => (
        <SidebarGroup key={group.label} className={cn('py-3', groupIdx > 0 && 'pt-2')}>
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5 px-1">
            {group.items.map((menu) => {
              if (menu.children?.length) {
                return (
                  <Collapsible
                    key={menu.href}
                    className="group/collapsible"
                    defaultOpen={menu.isActive}
                    title={menu.title}
                  >
                    <SidebarMenuButton
                      className="transition-all duration-200 hover:bg-accent/50 group-data-active:bg-primary/5 group-data-active:text-primary"
                      render={<CollapsibleTrigger />}
                    >
                      {menu.icon && <menu.icon className="size-4.5" />}
                      <span className="font-medium">{menu.title}</span>
                      <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l-2 border-muted/50 ml-3 gap-1 pl-4 mt-1">
                        {menu.children.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton
                              className="transition-all duration-200 hover:text-primary active:scale-[0.98]"
                              isActive={!!subItem.isActive}
                              render={<Link to={subItem.href} />}
                            >
                              <span className="text-sm font-normal">{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                )
              }

              return (
                <SidebarMenuItem key={menu.href}>
                  <SidebarMenuButton
                    className="transition-all duration-200 hover:bg-accent/50 active:scale-[0.98] data-active:bg-primary/5 data-active:text-primary"
                    isActive={!!menu.isActive}
                    render={<Link to={menu.href} />}
                    tooltip={menu.title}
                  >
                    {menu.icon && <menu.icon className="size-4.5" />}
                    <span className="font-medium">{menu.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </div>
  )
}

function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-6 transition-all duration-300 top-0 sticky bg-background/60 backdrop-blur-2xl z-20 animate-fade-in shadow-sm/5">
      <div className="flex items-center gap-3">
        <SidebarTrigger variant="ghost" size="icon-lg" className="hover:bg-accent/50 active:scale-90 transition-all" />
        <Separator orientation="vertical" className="h-4 bg-border/50" />
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <LocationSwitcher />
        <Separator orientation="vertical" className="h-4 bg-border/50" />
        <ThemeSwitcher />
      </div>
    </header>
  )
}
