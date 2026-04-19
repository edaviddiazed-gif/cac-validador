"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  CheckCircle,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Cargar Archivo", icon: Upload },
  { href: "/dashboard/manual-entry", label: "Entrada Manual", icon: FileText },
  { href: "/dashboard/reports", label: "Reportes", icon: FileText },
  { href: "/dashboard/catalogos", label: "Catálogos", icon: BookOpen },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <CheckCircle className="h-7 w-7 text-cac-teal" />
        <div>
          <h1 className="text-sm font-bold tracking-tight">CAC Validador</h1>
          <p className="text-[10px] text-muted-foreground">v2.0 · Res. 0247/2014</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks />
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sheet */}
      <Sheet>
        <SheetTrigger>
          <div
            role="button"
            tabIndex={0}
            className="lg:hidden fixed top-3 left-3 z-50 group/button inline-flex shrink-0 items-center justify-center rounded-lg text-sm"
          >
            <Menu className="h-5 w-5" />
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
