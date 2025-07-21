import { BlogCommentsTable } from "@/components/blog/BlogCommentsTable";

export default function BlogCommentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comentarios del Blog</h1>
        <p className="text-muted-foreground">
          Gestiona todos los comentarios de las entradas de tu blog.
        </p>
      </div>
      
      <BlogCommentsTable />
    </div>
  );
} 