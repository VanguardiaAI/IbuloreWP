"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Orisha {
  id: number;
  name: string;
}

interface OrishaSelectorProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

export function OrishaSelector({ value, onValueChange }: OrishaSelectorProps) {
  const [orishas, setOrishas] = useState<Orisha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrishas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/orishas`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los orishas");
      }
      const data = await response.json();
      setOrishas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrishas();
  }, [fetchOrishas]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar un Orisha" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0">Ninguno</SelectItem>
        {orishas.map((orisha) => (
          <SelectItem key={orisha.id} value={orisha.id.toString()}>
            {orisha.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 