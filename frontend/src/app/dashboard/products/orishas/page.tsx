"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { OrishasTable, Orisha } from "@/components/products/OrishasTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrishasPage() {
  const [orishas, setOrishas] = useState<Orisha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrishas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/orishas`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setOrishas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los orishas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrishas();
  }, [fetchOrishas]);
  
  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este orisha? Esta acción no se puede deshacer.")) {
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
            const response = await fetch(`${API_BASE_URL}/orishas/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setOrishas(prevOrishas => prevOrishas.filter(o => o.id !== id));
                alert("Orisha eliminado correctamente.");
            } else {
                const errorData = await response.json();
                alert(`Error al eliminar: ${errorData.error || "Error desconocido"}`);
            }
        } catch (error) {
            alert("Error al conectar con el servidor para eliminar el orisha.");
        }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orishas</h1>
          <p className="text-muted-foreground">
            Gestiona a qué orisha pertenece cada producto.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrishas} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
            </Button>
            <Link href="/dashboard/products/orishas/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Orisha
              </Button>
            </Link>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
        <OrishasTable data={orishas} onDelete={handleDelete} />
      )}
    </div>
  );
} 