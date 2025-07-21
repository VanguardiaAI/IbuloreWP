"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Globe,
  Calendar,
  MessageSquare,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Reply,
  Eye,
} from "lucide-react";

interface BlogComment {
  id: number;
  post: number;
  author: number;
  author_name: string;
  author_email: string;
  author_url: string;
  author_ip: string;
  author_user_agent: string;
  content: {
    rendered: string;
    raw?: string;
  };
  date: string;
  date_gmt: string;
  link: string;
  parent: number;
  status: 'approved' | 'hold' | 'spam' | 'trash';
  type: string;
  author_avatar_urls: {
    [key: string]: string;
  };
  meta: any;
  _embedded?: {
    up?: Array<{
      id: number;
      title: {
        rendered: string;
      };
    }>;
  };
}

interface CommentDetailDialogProps {
  comment: BlogComment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (commentId: number) => void;
  onReject?: (commentId: number) => void;
  onMarkAsSpam?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  onEdit?: (comment: BlogComment) => void;
  onReply?: (comment: BlogComment) => void;
}

const statusColors = {
  approved: "bg-green-100 text-green-800 border-green-200",
  hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  spam: "bg-red-100 text-red-800 border-red-200",
  trash: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels = {
  approved: "Aprobado",
  hold: "Pendiente",
  spam: "Spam",
  trash: "Papelera",
};

const statusIcons = {
  approved: Check,
  hold: AlertTriangle,
  spam: X,
  trash: Trash2,
};

export function CommentDetailDialog({
  comment,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onMarkAsSpam,
  onDelete,
  onEdit,
  onReply,
}: CommentDetailDialogProps) {
  if (!comment) return null;

  const StatusIcon = statusIcons[comment.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPostTitle = () => {
    return comment._embedded?.up?.[0]?.title?.rendered || `Entrada #${comment.post}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Detalles del Comentario
          </DialogTitle>
          <DialogDescription>
            Información completa del comentario y acciones disponibles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado y acciones principales */}
          <div className="flex items-center justify-between">
            <Badge className={`${statusColors[comment.status]} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusLabels[comment.status]}
            </Badge>
            
            <div className="flex gap-2">
              {comment.status !== 'approved' && onApprove && (
                <Button
                  size="sm"
                  onClick={() => onApprove(comment.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprobar
                </Button>
              )}
              
              {comment.status === 'approved' && onReject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(comment.id)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Marcar como pendiente
                </Button>
              )}
              
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(comment)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              
              {onReply && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReply(comment)}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Responder
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del autor */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Autor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {comment.author_avatar_urls?.['96'] ? (
                    <img 
                      src={comment.author_avatar_urls['96']} 
                      alt={comment.author_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-lg">{comment.author_name}</p>
                    {comment.author > 0 && (
                      <p className="text-sm text-muted-foreground">Usuario registrado</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{comment.author_email}</span>
                  </div>
                  
                  {comment.author_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={comment.author_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {comment.author_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <strong>IP:</strong> {comment.author_ip}
                </div>
                <div>
                  <strong>User Agent:</strong> 
                  <p className="mt-1 break-all">{comment.author_user_agent}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del comentario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalles del Comentario</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID del comentario:</strong> {comment.id}
              </div>
              <div>
                <strong>Entrada:</strong> {getPostTitle()}
              </div>
              <div>
                <strong>Fecha de publicación:</strong> {formatDate(comment.date)}
              </div>
              <div>
                <strong>Tipo:</strong> {comment.type}
              </div>
              {comment.parent > 0 && (
                <div>
                  <strong>Respuesta a:</strong> Comentario #{comment.parent}
                </div>
              )}
              <div>
                <strong>Enlace:</strong> 
                <a 
                  href={comment.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Ver en sitio web
                </a>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contenido del comentario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contenido</h3>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: comment.content.rendered }}
              />
            </div>
          </div>

          <Separator />

          {/* Acciones adicionales */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {comment.status !== 'spam' && onMarkAsSpam && (
                <Button
                  variant="outline"
                  onClick={() => onMarkAsSpam(comment.id)}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Marcar como spam
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              )}
              
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 