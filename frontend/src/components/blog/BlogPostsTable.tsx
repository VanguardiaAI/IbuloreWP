"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Image,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/api";

interface BlogPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  status: string;
  date: string;
  modified: string;
  author: number;
  categories: number[];
  tags: number[];
  featured_media: number;
  slug: string;
  link: string;
  _embedded?: {
    author: Array<{
      id: number;
      name: string;
    }>;
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    "wp:term": Array<Array<{
      id: number;
      name: string;
      taxonomy: string;
    }>>;
  };
}

const statusColors = {
  publish: "bg-green-100 text-green-800",
  draft: "bg-yellow-100 text-yellow-800",
  pending: "bg-blue-100 text-blue-800",
  private: "bg-gray-100 text-gray-800",
  trash: "bg-red-100 text-red-800",
};

const statusLabels = {
  publish: "Publicado",
  draft: "Borrador",
  pending: "Pendiente",
  private: "Privado",
  trash: "Papelera",
};

export function BlogPostsTable() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getPosts({
        page: currentPage,
        per_page: 20,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        _embed: true,
      });
      
      console.log("Blog API Response:", response);
      setPosts(response.posts);
      setTotalPages(response.pagination.total_pages);
      setTotalPosts(response.pagination.total);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const handleDelete = async (postId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta entrada?")) {
      try {
        await blogApi.deletePost(postId);
        fetchPosts();
      } catch (error) {
        console.error("Error deleting post:", error);
      }
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

  const getAuthorName = (post: BlogPost) => {
    return post._embedded?.author?.[0]?.name || "Autor desconocido";
  };

  const getCategories = (post: BlogPost) => {
    return post._embedded?.["wp:term"]?.[0]?.filter(term => term.taxonomy === "category") || [];
  };

  const getTags = (post: BlogPost) => {
    return post._embedded?.["wp:term"]?.[1]?.filter(term => term.taxonomy === "post_tag") || [];
  };

  const getFeaturedImage = (post: BlogPost) => {
    return post._embedded?.["wp:featuredmedia"]?.[0];
  };

  const handleRowClick = (postId: number, event: React.MouseEvent) => {
    // Evitar navegación si se hace clic en el dropdown de acciones
    if ((event.target as HTMLElement).closest('[data-radix-collection-item]') || 
        (event.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/dashboard/blog/${postId}/edit`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Cargando entradas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar entradas..."
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
                <SelectItem value="publish">Publicado</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Entradas del Blog ({totalPosts} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagen</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Categorías & Tags</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow 
                  key={post.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(post.id, e)}
                >
                  <TableCell>
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center border">
                      {getFeaturedImage(post) ? (
                        <img
                          src={getFeaturedImage(post)?.source_url}
                          alt={getFeaturedImage(post)?.alt_text || post.title.rendered}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Image className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium line-clamp-2">
                        {post.title.rendered}
                      </div>
                      <div 
                        className="text-sm text-muted-foreground line-clamp-1"
                        dangerouslySetInnerHTML={{ 
                          __html: post.excerpt.rendered.replace(/<[^>]*>/g, '') 
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getAuthorName(post)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {/* Categorías */}
                      {getCategories(post).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getCategories(post).slice(0, 2).map((category) => (
                            <Badge key={category.id} variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                          {getCategories(post).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{getCategories(post).length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Tags */}
                      {getTags(post).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getTags(post).slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Tag className="mr-1 h-2 w-2" />
                              {tag.name}
                            </Badge>
                          ))}
                          {getTags(post).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{getTags(post).length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Mensaje si no hay categorías ni tags */}
                      {getCategories(post).length === 0 && getTags(post).length === 0 && (
                        <span className="text-xs text-muted-foreground">Sin categorizar</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${statusColors[post.status as keyof typeof statusColors]} text-xs`}
                    >
                      {statusLabels[post.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(post.date)}
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/blog/${post.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={post.link} target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver en sitio
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Mensaje cuando no hay posts */}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron entradas del blog.</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || statusFilter !== "all" 
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Crea tu primera entrada usando el botón 'Nueva Entrada'."}
              </p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
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
        </CardContent>
      </Card>
    </div>
  );
} 