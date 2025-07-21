"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { AIIdeaGenerator } from "@/components/blog/AIIdeaGenerator";
import { AIContentGenerator } from "@/components/blog/AIContentGenerator";

interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  categories: string[];
  tags: string[];
}

export default function AIGeneratorPage() {
  const [selectedIdea, setSelectedIdea] = useState<string>("");
  const router = useRouter();

  const handleIdeaSelected = (idea: string) => {
    setSelectedIdea(idea);
  };

  const handleContentGenerated = (content: GeneratedContent) => {
    // Redireccionar a la página de nueva entrada con el contenido generado
    const params = new URLSearchParams({
      ai_content: JSON.stringify(content)
    });
    router.push(`/dashboard/blog/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header mejorado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/blog/new">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Generador de Artículos con IA
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Crea contenido SEO optimizado sobre Santería Yoruba con inteligencia artificial
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-full">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Powered by GPT-4</span>
          </div>
        </div>

        {/* Layout mejorado */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Generador de ideas - más compacto */}
          <div className="xl:col-span-1">
            <Card className="h-fit shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  Ideas de Artículos
                </CardTitle>
                <CardDescription className="text-sm">
                  Selecciona o genera nuevas ideas para tu artículo
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <AIIdeaGenerator onIdeaSelected={handleIdeaSelected} />
              </CardContent>
            </Card>
          </div>

          {/* Generador de contenido - más espacio */}
          <div className="xl:col-span-2">
            <Card className="h-fit shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  Configuración del Artículo
                </CardTitle>
                <CardDescription className="text-sm">
                  Personaliza los detalles y genera tu contenido optimizado
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <AIContentGenerator 
                  selectedIdea={selectedIdea}
                  onContentGenerated={handleContentGenerated}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            El contenido generado es una base que puedes editar y personalizar según tus necesidades
          </p>
        </div>
      </div>
    </div>
  );
} 