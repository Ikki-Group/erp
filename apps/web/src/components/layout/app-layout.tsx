import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { Suspense, useMemo } from 'react'

import { IkkiLogo } from '@/components/common/logo'
import { ThemeSwitcher } from '@/components/common/theme'
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

import { LoadingPage } from '../common/loading-page'
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
      <SidebarInset>
        <Header />
        <Suspense fallback={<LoadingPage />}>
          <main className="flex flex-1 flex-col h-full overflow-hidden @container">
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
    <>
      {groups.map((group, groupIdx) => (
        <SidebarGroup key={group.label} className={cn('py-2', groupIdx > 0 && 'pt-0')}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {group.items.map((menu) => {
              if (menu.children?.length) {
                return (
                  <Collapsible
                    key={menu.href}
                    className="group/collapsible"
                    defaultOpen={menu.isActive}
                    title={menu.title}
                  >
                    <SidebarMenuButton render={<CollapsibleTrigger />}>
                      {menu.icon && <menu.icon />}
                      <span>{menu.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {menu.children.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton isActive={!!subItem.isActive} render={<Link to={subItem.href} />}>
                              <span>{subItem.title}</span>
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
                  <SidebarMenuButton isActive={!!menu.isActive} render={<Link to={menu.href} />} tooltip={menu.title}>
                    {menu.icon && <menu.icon />}
                    <span>{menu.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear top-0 sticky bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/20">
      <div className="flex items-center gap-2">
        <SidebarTrigger variant="outline" size="icon-lg" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <LocationSwitcher />
        <Separator orientation="vertical" className="h-4" />
        <ThemeSwitcher />
      </div>
    </header>
  )
}
