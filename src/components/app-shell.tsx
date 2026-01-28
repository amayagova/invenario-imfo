'use client';

import {
  LayoutDashboard,
  Store,
  Package,
  FileText,
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
];


function AppShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"/><path d="M48,88V208a8,8,0,0,0,8,8H200a8,8,0,0,0,8-8V88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M32,120,128,32l96,88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M160,216V144a32,32,0,0,0-64,0v72" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"/><path d="M48,88V208a8,8,0,0,0,8,8H200a8,8,0,0,0,8-8V88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M32,120,128,32l96,88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M160,216V144a32,32,0,0,0-64,0v72" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                            <span>InvControl</span>
                        </div>
                    </div>
                    <ThemeToggle />
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
