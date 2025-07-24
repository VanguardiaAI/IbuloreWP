"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    router.push('/');
  };

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Botón de menú alternativo para móvil */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm hidden sm:block">Bienvenido de nuevo</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Settings className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Configuración</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
} 