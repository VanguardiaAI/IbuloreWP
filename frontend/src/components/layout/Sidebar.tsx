"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Mail,
  Send,
  BookOpenText,
  Newspaper,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Tags,
  PlusCircle,
  MessageSquare,
  UsersRound,
  PenSquare,
  Bot,
  List,
  Warehouse,
  Shield,
  Sparkles,
  Camera,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainSections = [
  {
    title: "Pedidos",
    icon: ShoppingCart,
    subsections: [
      { title: "Todos los pedidos", href: "/dashboard/orders", icon: List },
      { title: "Añadir pedido", href: "/dashboard/orders/new", icon: PlusCircle },
      { title: "Clientes", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    title: "Productos",
    icon: Package,
    subsections: [
      { title: "Todos los productos", href: "/dashboard/products", icon: List },
      { title: "Añadir nuevo", href: "/dashboard/products/new", icon: PlusCircle },
      { title: "Foto producto IA", href: "/dashboard/products/ai-photo", icon: Camera },
      { title: "Orishas", href: "/dashboard/products/orishas", icon: Tags },
      { title: "Categorías", href: "/dashboard/products/categories", icon: FolderTree },

      { title: "Inventario", href: "/dashboard/inventory", icon: Warehouse },
    ],
  },
  {
    title: "Newsletter",
    icon: Mail,
    subsections: [
        { title: "Suscriptores", href: "/dashboard/newsletter/subscribers", icon: UsersRound },
        { title: "Crear campaña", href: "/dashboard/newsletter/campaigns/new", icon: Send },
        { title: "Plantillas", href: "/dashboard/newsletter/templates", icon: PenSquare },
        { title: "Automatizaciones", href: "/dashboard/newsletter/automations", icon: Bot },
    ],
  },
  {
    title: "Contenido (Blog)",
    icon: BookOpenText,
    subsections: [
      { title: "Todas las entradas", href: "/dashboard/blog", icon: Newspaper },
      { title: "Añadir nueva", href: "/dashboard/blog/new", icon: PlusCircle },
      { title: "Generar con IA", href: "/dashboard/blog/ai-generator", icon: Sparkles },
      { title: "Categorías del Blog", href: "/dashboard/blog/categories", icon: FolderTree },
      { title: "Comentarios", href: "/dashboard/blog/comments", icon: MessageSquare },
    ],
  },
];

// Función para determinar qué sección debe estar abierta basada en la ruta actual
const getSectionFromPath = (pathname: string): string | null => {
  if (pathname.startsWith("/dashboard/orders") || pathname.startsWith("/dashboard/customers")) {
    return "Pedidos";
  }
  if (pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/inventory")) {
    return "Productos";
  }
  if (pathname.startsWith("/dashboard/newsletter")) {
    return "Newsletter";
  }
  if (pathname.startsWith("/dashboard/blog")) {
    return "Contenido (Blog)";
  }
  return null;
};

// Función para verificar si un enlace está activo
const isLinkActive = (href: string, pathname: string): boolean => {
  // Dashboard principal - solo exacto
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  
  // Coincidencia exacta - siempre tiene prioridad
  if (pathname === href) {
    return true;
  }
  
  // Para rutas con IDs (como /dashboard/products/123/edit)
  // Solo activar el enlace base si NO hay una coincidencia exacta más específica
  if (pathname.startsWith(href + "/")) {
    const remainingPath = pathname.slice(href.length + 1);
    const segments = remainingPath.split("/");
    
    if (segments.length > 0) {
      const firstSegment = segments[0];
      
      // Si el primer segmento es un ID numérico, activar el enlace base
      if (/^\d+$/.test(firstSegment)) {
        return true;
      }
      
      // Si el primer segmento es una acción específica, NO activar el enlace base
      // porque debe haber un enlace más específico para esa acción
      if (['new', 'edit', 'ai-photo', 'ai-generator'].includes(firstSegment)) {
        return false;
      }
    }
  }
  
  return false;
};

interface SidebarContentProps {
  onLinkClick?: () => void;
}

function SidebarContent({ onLinkClick }: SidebarContentProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Efecto para abrir automáticamente la sección correspondiente a la ruta actual
  useEffect(() => {
    const currentSection = getSectionFromPath(pathname);
    if (currentSection) {
      setOpenSections(prev => ({ ...prev, [currentSection]: true }));
    }
  }, [pathname]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-x-hidden">
      {/* Logo y título */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <Shield className="h-8 w-8 text-primary flex-shrink-0" />
        <h1 className="text-xl font-bold truncate">Ibulore Panel</h1>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Dashboard principal */}
        <Link href="/dashboard" onClick={handleLinkClick}>
          <Button 
            variant={pathname === "/dashboard" ? "secondary" : "ghost"} 
            className={cn(
              "w-full justify-start text-base px-2 sidebar-item-hover",
              pathname === "/dashboard" && "bg-primary/10 text-primary font-medium"
            )}
          >
            <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Dashboard</span>
          </Button>
        </Link>

        {/* Secciones principales */}
        {mainSections.map((section) => (
          <Collapsible
            key={section.title}
            open={openSections[section.title] || false}
            onOpenChange={() => toggleSection(section.title)}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-between text-base px-2 sidebar-item-hover",
                  getSectionFromPath(pathname) === section.title && "bg-primary/5 text-primary"
                )}
              >
                <div className="flex items-center min-w-0">
                  <section.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{section.title}</span>
                </div>
                {openSections[section.title] ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-1 pl-6">
              <div className="flex flex-col space-y-1">
                {section.subsections.map((subsection) => (
                  <Link key={subsection.title} href={subsection.href} onClick={handleLinkClick}>
                    <Button
                      variant={isLinkActive(subsection.href, pathname) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start font-normal h-9 text-sm sidebar-item-hover",
                        isLinkActive(subsection.href, pathname) 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <subsection.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{subsection.title}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* Espacio para futuras opciones de usuario */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="px-2 text-xs text-muted-foreground">
          Panel de Administración
        </div>
      </div>
    </div>
  );
}

// Componente principal de la barra lateral (versión simplificada sin Sheet por ahora)
export function Sidebar() {
  return (
    <>
      {/* Botón para móvil (temporal, sin funcionalidad hasta resolver Sheet) */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border"
        disabled
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menú (próximamente)</span>
      </Button>

      {/* Barra lateral para desktop */}
      <aside className="hidden md:flex w-64 min-h-screen bg-card text-card-foreground border-r border-border p-4 flex-col fixed left-0 top-0 z-40 overflow-x-hidden">
        <SidebarContent />
      </aside>
    </>
  );
} 