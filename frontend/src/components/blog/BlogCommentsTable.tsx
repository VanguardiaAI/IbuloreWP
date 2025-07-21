"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Search,
  Check,
  X,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Globe,
  Reply,
  Trash2,
  AlertTriangle,
  Eye,
  Filter,
  RefreshCw,
  Edit,
} from "lucide-react";
import { blogApi } from "@/lib/api";
import { CommentDetailDialog } from "./CommentDetailDialog";

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

interface CommentCounts {
  approved: number;
  hold: number;
  spam: number;
  trash: number;
  total: number;
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

export function BlogCommentsTable() {
  // Simple notification system
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // For now, using alert - can be replaced with a proper toast system later
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(`Éxito: ${message}`);
    }
  };

  // Improved notification for status changes
  const showStatusChangeNotification = (action: string, newStatus: string, filterChanged: boolean) => {
    let message = `Comentario ${action}`;
    if (filterChanged) {
      message += ` y filtro cambiado a 'Todos' para mostrar el comentario en su nuevo estado (${statusLabels[newStatus as keyof typeof statusLabels]})`;
    }
    showNotification(message);
  };

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [commentCounts, setCommentCounts] = useState<CommentCounts>({
    approved: 0,
    hold: 0,
    spam: 0,
    trash: 0,
    total: 0,
  });
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [editingComment, setEditingComment] = useState<BlogComment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editAuthorEmail, setEditAuthorEmail] = useState("");
  const [editAuthorUrl, setEditAuthorUrl] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [replyingTo, setReplyingTo] = useState<BlogComment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthorName, setReplyAuthorName] = useState("Administrador");
  const [replyAuthorEmail, setReplyAuthorEmail] = useState("admin@ibulore.com");
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState<BlogComment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getComments({
        page: currentPage,
        per_page: 20,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter as any,
        _embed: true,
        order: 'desc',
        orderby: 'date',
      });
      
      setComments(response.comments || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalComments(response.pagination?.total || 0);
      setBackendAvailable(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setBackendAvailable(false);
      showNotification("No se pudieron cargar los comentarios. Verifica que el backend esté funcionando.", "error");
      // Set empty state on error
      setComments([]);
      setTotalPages(1);
      setTotalComments(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentCounts = async () => {
    try {
      // Try to get counts from API first
      const counts = await blogApi.getCommentCounts();
      setCommentCounts(counts);
    } catch (error) {
      // Silently fall back to calculating from current comments
      // This is expected when the backend endpoint doesn't exist yet
      calculateCountsFromComments();
    }
  };

  const calculateCountsFromComments = () => {
    // Calculate counts from current comments data
    const counts = {
      approved: 0,
      hold: 0,
      spam: 0,
      trash: 0,
      total: 0,
    };

    if (comments && comments.length > 0) {
      comments.forEach(comment => {
        if (comment.status && counts.hasOwnProperty(comment.status)) {
          counts[comment.status]++;
          counts.total++;
        }
      });
    }

    setCommentCounts(counts);
  };

  const loadDemoData = () => {
    // Demo data for when backend is not available
    const demoComments: BlogComment[] = [
      {
        id: 1,
        post: 123,
        author: 0,
        author_name: "María González",
        author_email: "maria@example.com",
        author_url: "",
        author_ip: "192.168.1.100",
        author_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        content: {
          rendered: "<p>¡Excelente artículo sobre los Orishas! Me ha ayudado mucho a entender mejor la tradición yoruba.</p>",
        },
        date: new Date().toISOString(),
        date_gmt: new Date().toISOString(),
        link: "#",
        parent: 0,
        status: 'approved' as const,
        type: "comment",
        author_avatar_urls: {},
        meta: {},
        _embedded: {
          up: [{
            id: 123,
            title: { rendered: "Introducción a los Orishas Yoruba" }
          }]
        }
      },
      {
        id: 2,
        post: 124,
        author: 0,
        author_name: "Carlos Rodríguez",
        author_email: "carlos@example.com",
        author_url: "https://example.com",
        author_ip: "192.168.1.101",
        author_user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        content: {
          rendered: "<p>¿Podrían hacer un artículo sobre las ceremonias de iniciación? Estoy muy interesado en aprender más.</p>",
        },
        date: new Date(Date.now() - 86400000).toISOString(),
        date_gmt: new Date(Date.now() - 86400000).toISOString(),
        link: "#",
        parent: 0,
        status: 'hold' as const,
        type: "comment",
        author_avatar_urls: {},
        meta: {},
        _embedded: {
          up: [{
            id: 124,
            title: { rendered: "Rituales y Ceremonias Yoruba" }
          }]
        }
      },
      {
        id: 3,
        post: 123,
        author: 0,
        author_name: "Spam User",
        author_email: "spam@spam.com",
        author_url: "https://spam-site.com",
        author_ip: "192.168.1.102",
        author_user_agent: "Bot/1.0",
        content: {
          rendered: "<p>¡Compra productos baratos aquí! ¡Oferta especial!</p>",
        },
        date: new Date(Date.now() - 172800000).toISOString(),
        date_gmt: new Date(Date.now() - 172800000).toISOString(),
        link: "#",
        parent: 0,
        status: 'spam' as const,
        type: "comment",
        author_avatar_urls: {},
        meta: {},
        _embedded: {
          up: [{
            id: 123,
            title: { rendered: "Introducción a los Orishas Yoruba" }
          }]
        }
      },
      {
        id: 4,
        post: 123,
        author: 1,
        author_name: "Administrador",
        author_email: "admin@ibulore.com",
        author_url: "",
        author_ip: "127.0.0.1",
        author_user_agent: "Admin Panel",
        content: {
          rendered: "<p>¡Gracias por tu comentario, María! Me alegra saber que el artículo te ha sido útil. Si tienes alguna pregunta específica sobre los Orishas, no dudes en preguntar.</p>",
        },
        date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        date_gmt: new Date(Date.now() - 3600000).toISOString(),
        link: "#",
        parent: 1, // Reply to María's comment
        status: 'approved' as const,
        type: "comment",
        author_avatar_urls: {},
        meta: {},
        _embedded: {
          up: [{
            id: 123,
            title: { rendered: "Introducción a los Orishas Yoruba" }
          }]
        }
      },
      {
        id: 5,
        post: 124,
        author: 1,
        author_name: "Administrador",
        author_email: "admin@ibulore.com",
        author_url: "",
        author_ip: "127.0.0.1",
        author_user_agent: "Admin Panel",
        content: {
          rendered: "<p>Hola Carlos, excelente sugerencia. Estamos preparando una serie de artículos sobre ceremonias de iniciación. Te notificaremos cuando esté disponible.</p>",
        },
        date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        date_gmt: new Date(Date.now() - 7200000).toISOString(),
        link: "#",
        parent: 2, // Reply to Carlos's comment
        status: 'approved' as const,
        type: "comment",
        author_avatar_urls: {},
        meta: {},
        _embedded: {
          up: [{
            id: 124,
            title: { rendered: "Rituales y Ceremonias Yoruba" }
          }]
        }
      }
    ];

    setComments(demoComments);
    setTotalPages(1);
    setTotalComments(demoComments.length);
    setBackendAvailable(false);
    
    // Calculate demo counts
    const demoCounts = {
      approved: 3, // Updated count including replies
      hold: 1,
      spam: 1,
      trash: 0,
      total: 5, // Updated total
    };
    setCommentCounts(demoCounts);
  };

  useEffect(() => {
    fetchComments();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchCommentCounts();
  }, []);

  // Recalculate counts when comments change (only if backend is not available)
  useEffect(() => {
    if (comments.length > 0 && !backendAvailable) {
      calculateCountsFromComments();
    }
  }, [comments, backendAvailable]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchComments();
  };

  const handleApprove = async (commentId: number) => {
    try {
      await blogApi.approveComment(commentId);
      
      // Verificar si necesitamos cambiar el filtro
      const needsFilterChange = statusFilter !== "all" && statusFilter !== "approved";
      if (needsFilterChange) {
        setStatusFilter("all");
      }
      
      showStatusChangeNotification("aprobado", 'approved', needsFilterChange);
      
      fetchComments();
      fetchCommentCounts();
    } catch (error) {
      console.error("Error approving comment:", error);
      showNotification("No se pudo aprobar el comentario", "error");
    }
  };

  const handleReject = async (commentId: number) => {
    try {
      await blogApi.rejectComment(commentId);
      
      // Verificar si necesitamos cambiar el filtro
      const needsFilterChange = statusFilter !== "all" && statusFilter !== "hold";
      if (needsFilterChange) {
        setStatusFilter("all");
      }
      
      showStatusChangeNotification("marcado como pendiente", 'hold', needsFilterChange);
      
      fetchComments();
      fetchCommentCounts();
    } catch (error) {
      console.error("Error rejecting comment:", error);
      showNotification("No se pudo rechazar el comentario", "error");
    }
  };

  const handleMarkAsSpam = async (commentId: number) => {
    try {
      await blogApi.markCommentAsSpam(commentId);
      
      // Verificar si necesitamos cambiar el filtro
      const needsFilterChange = statusFilter !== "all" && statusFilter !== "spam";
      if (needsFilterChange) {
        setStatusFilter("all");
      }
      
      showStatusChangeNotification("marcado como spam", 'spam', needsFilterChange);
      
      fetchComments();
      fetchCommentCounts();
    } catch (error) {
      console.error("Error marking comment as spam:", error);
      showNotification("No se pudo marcar el comentario como spam", "error");
    }
  };

  const handleDelete = async (commentId: number, force = false) => {
    try {
      await blogApi.deleteComment(commentId, force);
      
      if (force) {
        showNotification("Comentario eliminado permanentemente");
      } else {
        // Verificar si necesitamos cambiar el filtro para papelera
        const needsFilterChange = statusFilter !== "all" && statusFilter !== "trash";
        if (needsFilterChange) {
          setStatusFilter("all");
        }
        
        showStatusChangeNotification("enviado a la papelera", 'trash', needsFilterChange);
      }
      
      fetchComments();
      fetchCommentCounts();
    } catch (error) {
      console.error("Error deleting comment:", error);
      showNotification("No se pudo eliminar el comentario", "error");
    }
  };

  const handleEdit = (comment: BlogComment) => {
    setEditingComment(comment);
    setEditContent(comment.content.raw || comment.content.rendered.replace(/<[^>]*>/g, ''));
    setEditAuthorName(comment.author_name);
    setEditAuthorEmail(comment.author_email);
    setEditAuthorUrl(comment.author_url);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingComment) return;

    try {
      await blogApi.updateComment(editingComment.id, {
        content: editContent,
        author_name: editAuthorName,
        author_email: editAuthorEmail,
        author_url: editAuthorUrl,
      });
      
      showNotification("Comentario actualizado correctamente");
      
      setShowEditDialog(false);
      setEditingComment(null);
      fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      showNotification("No se pudo actualizar el comentario", "error");
    }
  };

  const handleReply = (comment: BlogComment) => {
    setReplyingTo(comment);
    setReplyContent("");
    setReplyAuthorName("Administrador");
    setReplyAuthorEmail("admin@ibulore.com");
    setShowReplyDialog(true);
  };

  const handleViewDetails = (comment: BlogComment) => {
    setSelectedComment(comment);
    setShowDetailDialog(true);
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyContent.trim()) return;

    try {
      if (backendAvailable) {
        // Try to send reply through API
        await blogApi.replyToComment(replyingTo.id, {
          content: replyContent,
          author_name: replyAuthorName,
          author_email: replyAuthorEmail,
        });
        
        showNotification("Respuesta enviada correctamente");
        fetchComments();
      } else {
        // Simulate reply creation locally
        const newReply: BlogComment = {
          id: Date.now(), // Use timestamp as temporary ID
          post: replyingTo.post,
          author: 1, // Admin user
          author_name: replyAuthorName,
          author_email: replyAuthorEmail,
          author_url: "",
          author_ip: "127.0.0.1",
          author_user_agent: "Admin Panel",
          content: {
            rendered: `<p>${replyContent}</p>`,
          },
          date: new Date().toISOString(),
          date_gmt: new Date().toISOString(),
          link: "#",
          parent: replyingTo.id, // This is a reply to the original comment
          status: 'approved' as const,
          type: "comment",
          author_avatar_urls: {},
          meta: {},
          _embedded: replyingTo._embedded,
        };

        // Add the reply to the comments list
        setComments(prevComments => [newReply, ...prevComments]);
        
        showNotification("Respuesta simulada creada (modo demo)");
      }
      
      setShowReplyDialog(false);
      setReplyingTo(null);
      setReplyContent("");
    } catch (error) {
      console.error("Error sending reply:", error);
      
      // Check if it's the "not available" error
      if (error instanceof Error && error.message.includes('no está disponible')) {
        // Fallback to local simulation
        const newReply: BlogComment = {
                     id: Date.now(),
           post: replyingTo.post,
           author: 1,
           author_name: replyAuthorName,
           author_email: replyAuthorEmail,
          author_url: "",
          author_ip: "127.0.0.1",
          author_user_agent: "Admin Panel",
          content: {
            rendered: `<p>${replyContent}</p>`,
          },
          date: new Date().toISOString(),
          date_gmt: new Date().toISOString(),
          link: "#",
          parent: replyingTo.id,
          status: 'approved' as const,
          type: "comment",
          author_avatar_urls: {},
          meta: {},
          _embedded: replyingTo._embedded,
        };

        setComments(prevComments => [newReply, ...prevComments]);
        
        showNotification("Respuesta creada en modo demo (backend no disponible)");
        
        setShowReplyDialog(false);
        setReplyingTo(null);
        setReplyContent("");
        setReplyAuthorName("Administrador");
        setReplyAuthorEmail("admin@ibulore.com");
      } else {
        showNotification("No se pudo enviar la respuesta", "error");
      }
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedComments.length === 0) return;

    try {
      await blogApi.bulkUpdateComments(selectedComments, bulkAction as any);
      
      showNotification(`Acción aplicada a ${selectedComments.length} comentarios`);
      
      setSelectedComments([]);
      setBulkAction("");
      setShowBulkDialog(false);
      fetchComments();
      fetchCommentCounts();
    } catch (error) {
      console.error("Error applying bulk action:", error);
      showNotification("No se pudo aplicar la acción masiva", "error");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComments(comments.map(comment => comment.id));
    } else {
      setSelectedComments([]);
    }
  };

  const handleSelectComment = (commentId: number, checked: boolean) => {
    if (checked) {
      setSelectedComments([...selectedComments, commentId]);
    } else {
      setSelectedComments(selectedComments.filter(id => id !== commentId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const getPostTitle = (comment: BlogComment) => {
    return comment._embedded?.up?.[0]?.title?.rendered || `Entrada #${comment.post}`;
  };

  const isReply = (comment: BlogComment) => {
    return comment.parent > 0;
  };

  const getParentComment = (comment: BlogComment) => {
    if (!isReply(comment)) return null;
    return comments.find(c => c.id === comment.parent);
  };

  const getRepliesCount = (commentId: number) => {
    return comments.filter(c => c.parent === commentId).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <div className="text-muted-foreground">Cargando comentarios...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

      return (
      <div className="space-y-6">
        {/* Estado del backend */}
        {!backendAvailable && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Backend no disponible</p>
                  <p className="text-sm">
                    No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en {`http://localhost:5001`}.
                  </p>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadDemoData}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Demo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setBackendAvailable(true);
                      fetchComments();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas de comentarios */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("all")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{commentCounts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("approved")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Aprobados</p>
                <p className="text-2xl font-bold">{commentCounts.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("hold")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold">{commentCounts.hold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("spam")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Spam</p>
                <p className="text-2xl font-bold">{commentCounts.spam}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("trash")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium">Papelera</p>
                <p className="text-2xl font-bold">{commentCounts.trash}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar comentarios por contenido, autor o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="hold">Pendientes</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="trash">Papelera</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Buscar</Button>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setCurrentPage(1);
              fetchComments();
            }}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acciones masivas */}
      {selectedComments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedComments.length} comentario(s) seleccionado(s)
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Acción masiva" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Aprobar</SelectItem>
                  <SelectItem value="hold">Marcar como pendiente</SelectItem>
                  <SelectItem value="spam">Marcar como spam</SelectItem>
                  <SelectItem value="trash">Enviar a papelera</SelectItem>
                  <SelectItem value="delete">Eliminar permanentemente</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowBulkDialog(true)}
                disabled={!bulkAction}
              >
                Aplicar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedComments([])}
              >
                Deseleccionar todo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de comentarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Comentarios del Blog ({totalComments} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay comentarios para mostrar</p>
              <p className="text-sm">
                {statusFilter === "all" 
                  ? "Los comentarios aparecerán aquí cuando los usuarios comenten en tus entradas."
                  : `No hay comentarios con el estado "${statusLabels[statusFilter as keyof typeof statusLabels]}".`
                }
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedComments.length === comments.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => {
                    const StatusIcon = statusIcons[comment.status];
                    return (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedComments.includes(comment.id)}
                            onCheckedChange={(checked) => handleSelectComment(comment.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {comment.author_avatar_urls?.['48'] ? (
                                <img 
                                  src={comment.author_avatar_urls['48']} 
                                  alt={comment.author_name}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{comment.author_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {comment.author_email}
                              </div>
                              {comment.author_url && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  <a 
                                    href={comment.author_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate max-w-[150px]"
                                  >
                                    {comment.author_url}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm line-clamp-3">
                              {stripHtml(comment.content.rendered)}
                            </p>
                            
                            {/* Show if this is a reply */}
                            {comment.parent > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                                <div className="flex items-center gap-1 mb-1">
                                  <Reply className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-700">
                                    Respuesta a comentario #{comment.parent}
                                  </span>
                                </div>
                                {(() => {
                                  const parentComment = getParentComment(comment);
                                  return parentComment ? (
                                    <div className="text-xs text-blue-600">
                                      <span className="font-medium">{parentComment.author_name}:</span>
                                      <span className="ml-1">
                                        {stripHtml(parentComment.content.rendered).substring(0, 50)}
                                        {stripHtml(parentComment.content.rendered).length > 50 ? '...' : ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-blue-600">Comentario padre no encontrado</span>
                                  );
                                })()}
                              </div>
                            )}
                            
                            {/* Show replies count if this comment has replies */}
                            {!isReply(comment) && getRepliesCount(comment.id) > 0 && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Reply className="h-3 w-3 mr-1" />
                                  {getRepliesCount(comment.id)} respuesta{getRepliesCount(comment.id) !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {getPostTitle(comment)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${statusColors[comment.status]} text-xs flex items-center gap-1 w-fit`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusLabels[comment.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(comment.date)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {comment.status !== 'approved' && (
                                <DropdownMenuItem onClick={() => handleApprove(comment.id)}>
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Aprobar
                                </DropdownMenuItem>
                              )}
                              
                              {comment.status === 'approved' && (
                                <DropdownMenuItem onClick={() => handleReject(comment.id)}>
                                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                                  Marcar como pendiente
                                </DropdownMenuItem>
                              )}
                              
                                                             <DropdownMenuItem onClick={() => handleViewDetails(comment)}>
                                 <Eye className="mr-2 h-4 w-4" />
                                 Ver detalles
                               </DropdownMenuItem>
                               
                               <DropdownMenuItem onClick={() => handleEdit(comment)}>
                                 <Edit className="mr-2 h-4 w-4" />
                                 Editar
                               </DropdownMenuItem>
                               
                               <DropdownMenuItem onClick={() => handleReply(comment)}>
                                 <Reply className="mr-2 h-4 w-4" />
                                 Responder
                               </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {comment.status !== 'spam' && (
                                <DropdownMenuItem 
                                  onClick={() => handleMarkAsSpam(comment.id)}
                                  className="text-orange-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Marcar como spam
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => {
                                  setCommentToDelete(comment.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({totalComments} comentarios total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar comentario */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Comentario</DialogTitle>
            <DialogDescription>
              Modifica el contenido y los datos del autor del comentario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author-name">Nombre del autor</Label>
                <Input
                  id="author-name"
                  value={editAuthorName}
                  onChange={(e) => setEditAuthorName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="author-email">Email del autor</Label>
                <Input
                  id="author-email"
                  type="email"
                  value={editAuthorEmail}
                  onChange={(e) => setEditAuthorEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="author-url">URL del autor (opcional)</Label>
              <Input
                id="author-url"
                type="url"
                value={editAuthorUrl}
                onChange={(e) => setEditAuthorUrl(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="comment-content">Contenido del comentario</Label>
              <Textarea
                id="comment-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para responder comentario */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Comentario</DialogTitle>
            <DialogDescription>
              Responde al comentario de {replyingTo?.author_name}
            </DialogDescription>
          </DialogHeader>
          
          {replyingTo && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{replyingTo.author_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[replyingTo.status]}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(replyingTo.date)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {stripHtml(replyingTo.content.rendered)}
                </p>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Entrada:</span> {getPostTitle(replyingTo)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reply-author-name">Tu nombre</Label>
                  <Input
                    id="reply-author-name"
                    value={replyAuthorName}
                    onChange={(e) => setReplyAuthorName(e.target.value)}
                    placeholder="Nombre del autor"
                  />
                </div>
                <div>
                  <Label htmlFor="reply-author-email">Tu email</Label>
                  <Input
                    id="reply-author-email"
                    type="email"
                    value={replyAuthorEmail}
                    onChange={(e) => setReplyAuthorEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="reply-content">Tu respuesta</Label>
                <Textarea
                  id="reply-content"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Escribe tu respuesta..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendReply} 
              disabled={!replyContent.trim() || !replyAuthorName.trim() || !replyAuthorEmail.trim()}
            >
              Enviar respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (commentToDelete) {
                  handleDelete(commentToDelete, true);
                  setCommentToDelete(null);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

             {/* Dialog de confirmación para acciones masivas */}
       <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Confirmar acción masiva</AlertDialogTitle>
             <AlertDialogDescription>
               ¿Estás seguro de que quieres aplicar la acción "{bulkAction}" a {selectedComments.length} comentario(s)?
               {bulkAction === 'delete' && ' Esta acción no se puede deshacer.'}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleBulkAction}
               className={bulkAction === 'delete' ? "bg-red-600 hover:bg-red-700" : ""}
             >
               Confirmar
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

       {/* Dialog de detalles del comentario */}
       <CommentDetailDialog
         comment={selectedComment}
         open={showDetailDialog}
         onOpenChange={setShowDetailDialog}
         onApprove={handleApprove}
         onReject={handleReject}
         onMarkAsSpam={handleMarkAsSpam}
         onDelete={(commentId) => {
           setCommentToDelete(commentId);
           setShowDeleteDialog(true);
           setShowDetailDialog(false);
         }}
         onEdit={(comment) => {
           handleEdit(comment);
           setShowDetailDialog(false);
         }}
         onReply={(comment) => {
           handleReply(comment);
           setShowDetailDialog(false);
         }}
       />
     </div>
   );
 } 