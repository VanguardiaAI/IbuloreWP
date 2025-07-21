"use client";

import { BlogPostForm } from "@/components/blog/BlogPostForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function NewBlogPostContent() {
  const searchParams = useSearchParams();
  const [aiContent, setAiContent] = useState<any>(null);
  const [showAiAlert, setShowAiAlert] = useState(false);

  useEffect(() => {
    const aiContentParam = searchParams.get('ai_content');
    if (aiContentParam) {
      try {
        const parsedContent = JSON.parse(aiContentParam);
        setAiContent(parsedContent);
        setShowAiAlert(true);
      } catch (error) {
        console.error('Error parsing AI content:', error);
      }
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crear Nueva Entrada</h1>
          <p className="text-muted-foreground">Escribe y publica una nueva entrada en tu blog</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/blog/ai-ideas">
            <Button variant="outline">
              <Wand2 className="mr-2 h-4 w-4" />
              Ideas con IA
            </Button>
          </Link>
          <Link href="/dashboard/blog/ai-content">
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Generar con IA
            </Button>
          </Link>
        </div>
      </div>

      {showAiAlert && aiContent && (
        <Alert className="border-purple-200 bg-purple-50">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            Se ha cargado el contenido generado por IA. Puedes editarlo y personalizarlo antes de publicar.
          </AlertDescription>
        </Alert>
      )}

      <BlogPostForm 
        initialData={aiContent}
      />
    </div>
  );
}

export default function NewBlogPostPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NewBlogPostContent />
    </Suspense>
  );
}