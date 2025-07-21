"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BlogPostForm } from "@/components/blog/BlogPostForm";
import { Card, CardContent } from "@/components/ui/card";
import { blogApi } from "@/lib/api";

export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postData = await blogApi.getPost(postId);
        setPost(postData);
      } catch (err) {
        setError("Error al cargar la entrada del blog");
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Cargando entrada...</div>
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

  return <BlogPostForm postId={postId} initialData={post} />;
} 