'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  FileText,
  Calendar,
  BarChart2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { Badge } from './ui/badge';

const menuItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/sucursales',
    label: 'Sucursales',
    icon: Store,
  },
  {
    href: '/maestro-productos',
    label: 'Maestro Productos',
    icon: Package,
  },
  {
    href: '/control-diario',
    label: 'Control Diario',
    icon: FileText,
  },
  {
    href: '/reportes',
    label: 'Reportes',
    icon: BarChart2,
  },
];


function capitalizeFirstLetter(string: string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function AppShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();
    const [today, setToday] = React.useState('');

    React.useEffect(() => {
      const date = new Date();
      const formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      setToday(capitalizeFirstLetter(formattedDate));
    }, []);

    const handleLinkClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };
    
    return (
        <>
            <Sidebar>
                <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"/><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm-8,152H48V64H208V192Z" fill="var(--sidebar-primary)"/><path d="M128,104a24,24,0,1,0,24,24A24,24,0,0,0,128,104Zm0,40a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z" fill="var(--sidebar-primary)"/><path d="M176,112a8,8,0,1,0,8,8A8,8,0,0,0,176,112Z" fill="var(--sidebar-primary)"/><path d="M64,168H96a8,8,0,0,0,0-16H64a8,8,0,0,0,0,16Z" fill="var(--sidebar-primary)"/></svg>
                    </Button>
                    <div className="flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight">InvControl</h2>
                    <p className="text-xs text-muted-foreground">Gestor de Inventario</p>
                    </div>
                </div>
                </SidebarHeader>
                <SidebarContent>
                <SidebarMenu className="p-2">
                    {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                        className="h-10 justify-start"
                        onClick={handleLinkClick}
                        >
                        <Link href={item.href}>
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                {/* Maybe user profile or something later */}
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:hidden">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="h-8 w-8" />
                        <div className="flex items-center gap-2 font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"/><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm-8,152H48V64H208V192Z" fill="currentColor"/><path d="M128,104a24,24,0,1,0,24,24A24,24,0,0,0,128,104Zm0,40a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z" fill="currentColor"/><path d="M176,112a8,8,0,1,0,8,8A8,8,0,0,0,176,112Z" fill="currentColor"/><path d="M64,168H96a8,8,0,0,0,0-16H64a8,8,0,0,0,0,16Z" fill="currentColor"/></svg>
                            <span>InvControl</span>
                        </div>
                    </div>
                    <ThemeToggle />
                </header>
                <header className="sticky top-0 z-20 hidden h-14 items-center justify-end gap-4 border-b bg-background/95 px-8 backdrop-blur md:flex">
                  <div className="flex items-center space-x-2">
                      <ThemeToggle />
                      <Badge variant="outline" className="h-10 items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {today ? <span>{today}</span> : <div className="w-32 h-4 bg-muted animate-pulse rounded-md" />}
                      </Badge>
                  </div>
                </header>
                <div className="flex-1">{children}</div>
            </SidebarInset>
        </>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellLayout>{children}</AppShellLayout>
    </SidebarProvider>
  );
}
