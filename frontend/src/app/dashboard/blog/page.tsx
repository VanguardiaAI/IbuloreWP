import { BlogPostsTable } from "@/components/blog/BlogPostsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Todas las Entradas del Blog</h1>
          <p className="text-muted-foreground">
            Gestiona todos los artículos de tu blog aquí. Crea, edita y optimiza para SEO.
          </p>
        </div>
        <Link href="/dashboard/blog/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Entrada
          </Button>
        </Link>
      </div>
      
      <BlogPostsTable />
    </div>
  );
} 