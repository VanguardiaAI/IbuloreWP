"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { categoriesApi } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategorySelectorProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

export function CategorySelector({ selectedCategories, setSelectedCategories }: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Cargar categorías de WooCommerce
  React.useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await categoriesApi.getCategories({ format: 'simple' });
        setCategories(response);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSelect = (currentValue: string) => {
    const newSelection = selectedCategories.includes(currentValue)
      ? selectedCategories.filter((value) => value !== currentValue)
      : [...selectedCategories, currentValue];
    setSelectedCategories(newSelection);
  };

  const getSelectedCategoryNames = () => {
    return selectedCategories.map(categoryId => {
      const category = categories.find(cat => cat.id.toString() === categoryId);
      return category ? category.name : categoryId;
    });
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-full justify-between h-auto">
        Cargando categorías...
      </Button>
    );
  }

  return (
    <div>
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto"
            >
            <div className="flex flex-wrap gap-1">
                {selectedCategories.length > 0
                ? getSelectedCategoryNames().map((name, index) => (
                    <Badge key={selectedCategories[index]} variant="secondary">
                        {name}
                    </Badge>
                    ))
                : "Seleccionar categorías..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
            <CommandInput placeholder="Buscar categoría..." />
            <CommandList>
                <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                <CommandGroup>
                {categories.map((category) => (
                    <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.id.toString())}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedCategories.includes(category.id.toString()) ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {category.name}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
            </Command>
        </PopoverContent>
        </Popover>
    </div>
  );
} 