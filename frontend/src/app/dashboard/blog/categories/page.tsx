import { BlogCategoriesTable } from "@/components/blog/BlogCategoriesTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function BlogCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías del Blog</h1>
          <p className="text-muted-foreground">
            Organiza tus entradas del blog en categorías temáticas.
          </p>
        </div>
        <Link href="/dashboard/blog/categories/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </Link>
      </div>
      
      <BlogCategoriesTable />
    </div>
  );
} 