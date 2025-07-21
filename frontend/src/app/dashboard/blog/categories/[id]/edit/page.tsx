"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BlogCategoryForm } from "@/components/blog/BlogCategoryForm";
import { Card, CardContent } from "@/components/ui/card";
import { blogApi } from "@/lib/api";

export default function EditBlogCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        // Obtener todas las categorías y filtrar por ID
        const response = await blogApi.getCategories({ per_page: 100 });
        const categoryData = response.categories.find(
          (cat: any) => cat.id === Number(categoryId)
        );
        
        if (categoryData) {
          setCategory(categoryData);
        } else {
          setError("Categoría no encontrada");
        }
      } catch (err) {
        setError("Error al cargar la categoría");
        console.error("Error fetching category:", err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Cargando categoría...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <BlogCategoryForm categoryId={categoryId} initialData={category} />;
} 