"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, RefreshCw, Sparkles } from "lucide-react";

interface AIIdeaGeneratorProps {
  onIdeaSelected: (idea: string) => void;
}

interface IdeaSuggestion {
  title: string;
  description: string;
  category: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
}

const predefinedIdeas: IdeaSuggestion[] = [
  {
    title: "Los 7 Orishas Principales y sus Características",
    description: "Guía completa sobre los orishas más venerados",
    category: "Orishas",
    difficulty: "Principiante"
  },
  {
    title: "Rituales de Purificación en la Santería Yoruba",
    description: "Diferentes rituales de limpieza espiritual",
    category: "Rituales",
    difficulty: "Intermedio"
  },
  {
    title: "Historia y Origen de la Santería en Cuba",
    description: "Cómo llegó la religión yoruba a América",
    category: "Historia",
    difficulty: "Principiante"
  },
  {
    title: "Plantas Sagradas en los Rituales Yorubas",
    description: "Hierbas utilizadas en ceremonias religiosas",
    category: "Botánica",
    difficulty: "Avanzado"
  },
  {
    title: "Collares y Protecciones Espirituales",
    description: "El significado de los elekes",
    category: "Protecciones",
    difficulty: "Intermedio"
  },
  {
    title: "Ifá: El Sistema de Adivinación Yoruba",
    description: "Fundamentos del oráculo de Ifá",
    category: "Adivinación",
    difficulty: "Avanzado"
  }
];

export function AIIdeaGenerator({ onIdeaSelected }: AIIdeaGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>(predefinedIdeas);
  const [selectedIdea, setSelectedIdea] = useState<string>("");

  const generateNewIdeas = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/blog/ai/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          focusArea: '',
          audienceLevel: 'todos'
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar ideas');
      }

      const data = await response.json();
      
      if (data.success && data.ideas) {
        const newIdeas: IdeaSuggestion[] = data.ideas.map((idea: any) => ({
          title: idea.title,
          description: idea.description,
          category: idea.category,
          difficulty: idea.difficulty as 'Principiante' | 'Intermedio' | 'Avanzado'
        }));
        
        setIdeas(newIdeas);
      } else {
        throw new Error('No se pudieron generar ideas');
      }
    } catch (error) {
      console.error("Error generando ideas:", error);
      
      const fallbackIdeas: IdeaSuggestion[] = [
        {
          title: "Ceremonias de Iniciación en la Santería",
          description: "Proceso completo de convertirse en santero/a",
          category: "Iniciación",
          difficulty: "Avanzado"
        },
        {
          title: "Música y Danza en los Rituales Yorubas",
          description: "Importancia de los tambores batá",
          category: "Música",
          difficulty: "Intermedio"
        },
        {
          title: "Altares Domésticos: Crear tu Espacio Sagrado",
          description: "Guía para montar altares en casa",
          category: "Prácticas",
          difficulty: "Principiante"
        },
        {
          title: "Patakines: Leyendas de los Orishas",
          description: "Historias tradicionales de los orishas",
          category: "Mitología",
          difficulty: "Principiante"
        },
        {
          title: "Caracolas y Adivinación con Dilogún",
          description: "Interpretar mensajes de los orishas",
          category: "Adivinación",
          difficulty: "Avanzado"
        },
        {
          title: "Ofrendas y Ebó: Alimentando a los Orishas",
          description: "Qué ofrecer a cada orisha",
          category: "Ofrendas",
          difficulty: "Intermedio"
        }
      ];
      
      setIdeas(fallbackIdeas);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = (idea: IdeaSuggestion) => {
    setSelectedIdea(idea.title);
    onIdeaSelected(idea.title);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Intermedio': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Avanzado': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Ideas Sugeridas</span>
        </div>
        <Button 
          onClick={generateNewIdeas} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {loading ? "Generando..." : "Nuevas Ideas"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {ideas.map((idea, index) => (
          <div
            key={index}
            className={`group relative p-3 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
              selectedIdea === idea.title 
                ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md' 
                : 'border-gray-200 hover:border-purple-200 bg-white'
            }`}
            onClick={() => handleSelectIdea(idea)}
          >
            {selectedIdea === idea.title && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm text-gray-900 leading-tight line-clamp-2 flex-1">
                  {idea.title}
                </h3>
                <div className="flex flex-col gap-1 shrink-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${getDifficultyColor(idea.difficulty)}`}
                  >
                    {idea.difficulty}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {idea.description}
              </p>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                  {idea.category}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedIdea && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            <p className="text-sm text-purple-800 font-medium">
              Idea seleccionada: <span className="font-normal">{selectedIdea}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 