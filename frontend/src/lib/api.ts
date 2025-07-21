// API base configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Generic API helper
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API Error');
  }

  return response.json();
}

// Orders API
export const ordersApi = {
  // Get orders with filters
  getOrders: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    customer?: number;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      orders: any[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>(`/orders?${searchParams.toString()}`);
  },

  // Get single order
  getOrder: async (orderId: string | number) => {
    return apiCall<any>(`/orders/${orderId}`);
  },

  // Create new order
  createOrder: async (orderData: any) => {
    return apiCall<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Update order
  updateOrder: async (orderId: string | number, orderData: any) => {
    return apiCall<any>(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  // Delete order
  deleteOrder: async (orderId: string | number, force = false) => {
    return apiCall<any>(`/orders/${orderId}?force=${force}`, {
      method: 'DELETE',
    });
  },

  // Get order statistics
  getOrderStats: async () => {
    return apiCall<{
      total_orders: number;
      pending_orders: number;
      processing_orders: number;
      completed_orders: number;
      cancelled_orders: number;
      total_revenue: number;
      average_order_value: number;
      orders_by_status: Record<string, number>;
      top_products: any[];
    }>('/orders/stats');
  },

  // Search orders
  searchOrders: async (query: string, limit = 10) => {
    return apiCall<{
      orders: any[];
    }>(`/orders/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Add note to order
  addOrderNote: async (orderId: string | number, noteData: {
    note: string;
    customer_note?: boolean;
  }) => {
    return apiCall<any>(`/orders/${orderId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  // Get order notes
  getOrderNotes: async (orderId: string | number) => {
    return apiCall<any[]>(`/orders/${orderId}/notes`);
  },

  // Get customer history for an order
  getCustomerHistory: async (orderId: string | number) => {
    return apiCall<{
      total_orders: number;
      total_spent: number;
      average_order_value: number;
      customer_id: number;
      is_guest: boolean;
    }>(`/orders/${orderId}/customer-history`);
  },

  // Get order metadata
  getOrderMetadata: async (orderId: string | number) => {
    return apiCall<{
      customer_ip: string;
      user_agent: string;
      device_type: string;
      origin: string;
      created_via: string;
      order_source: string;
    }>(`/orders/${orderId}/metadata`);
  },

  // Update order customer
  updateOrderCustomer: async (orderId: string | number, customerId: number) => {
    return apiCall<{
      message: string;
      order: any;
      customer: any;
      success: boolean;
    }>(`/orders/${orderId}/customer`, {
      method: 'PUT',
      body: JSON.stringify({ customer_id: customerId }),
    });
  },

  // Update order addresses
  updateOrderAddresses: async (orderId: string | number, addresses: {
    billing?: any;
    shipping?: any;
  }) => {
    return apiCall<{
      message: string;
      order: any;
      success: boolean;
    }>(`/orders/${orderId}/addresses`, {
      method: 'PUT',
      body: JSON.stringify(addresses),
    });
  },
};

// Customers API
export const customersApi = {
  // Get customers
  getCustomers: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    email?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      customers: any[];
      pagination: any;
    }>(`/customers?${searchParams.toString()}`);
  },

  // Get single customer
  getCustomer: async (customerId: string | number) => {
    return apiCall<any>(`/customers/${customerId}`);
  },

  // Create customer
  createCustomer: async (customerData: any) => {
    return apiCall<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  // Update customer
  updateCustomer: async (customerId: string | number, customerData: any) => {
    return apiCall<any>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  // Search customers
  searchCustomers: async (query: string, limit = 10) => {
    return apiCall<{
      customers: any[];
    }>(`/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Get customer orders
  getCustomerOrders: async (customerId: string | number, params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      orders: any[];
      customer_id: number;
      pagination: any;
    }>(`/customers/${customerId}/orders?${searchParams.toString()}`);
  },
};

// Products API
export const productsApi = {
  // Get all products
  getProducts: async (params?: {
    page?: number;
    per_page?: number;
    orderby?: string;
    order?: 'asc' | 'desc';
    status?: string;
    category?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<any[]>(`/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  },

  // Get single product
  getProduct: async (productId: string | number) => {
    return apiCall<any>(`/products/${productId}`);
  },

  // Create product
  createProduct: async (productData: any) => {
    return apiCall<any>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update product
  updateProduct: async (productId: string | number, productData: any) => {
    return apiCall<any>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Delete product
  deleteProduct: async (productId: string | number) => {
    return apiCall<any>(`/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Bulk delete products
  bulkDeleteProducts: async (productIds: number[]) => {
    return apiCall<{
      deleted: number[];
      failed: { id: number; error: string }[];
      total_deleted: number;
      total_failed: number;
    }>('/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
    });
  },

  // Search products
  searchProducts: async (query: string, params?: {
    limit?: number;
    category?: number;
    in_stock?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      products: any[];
    }>(`/products/search?${searchParams.toString()}`);
  },

  // Get products by category
  getProductsByCategory: async (categoryId: number, params?: {
    page?: number;
    per_page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      products: any[];
      category_id: number;
      pagination: any;
    }>(`/products/by-category/${categoryId}?${searchParams.toString()}`);
  },

  // Get low stock products
  getLowStockProducts: async (threshold = 5) => {
    return apiCall<{
      products: any[];
      threshold: number;
      total_low_stock: number;
    }>(`/products/low-stock?threshold=${threshold}`);
  },

  // Get recent products
  getRecentProducts: async (limit = 10) => {
    return apiCall<{
      products: any[];
    }>(`/products/recent?limit=${limit}`);
  },

  // Get product stock info
  getProductStock: async (productId: string | number) => {
    return apiCall<{
      product_id: number;
      name: string;
      sku: string;
      manage_stock: boolean;
      stock_quantity: number | null;
      stock_status: string;
      backorders: string;
      backorders_allowed: boolean;
      backordered: boolean;
      sold_individually: boolean;
      low_stock_amount: number | null;
    }>(`/products/${productId}/stock`);
  },
};

// Blog API
export const blogApi = {
  // Get posts
  getPosts: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    categories?: number[];
    tags?: number[];
    author?: number;
    _embed?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    
    return apiCall<{
      posts: any[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>(`/blog/posts?${searchParams.toString()}`);
  },

  // Get single post
  getPost: async (postId: string | number) => {
    return apiCall<any>(`/blog/posts/${postId}`);
  },

  // Create new post
  createPost: async (postData: {
    title: string;
    content: string;
    excerpt?: string;
    status?: 'draft' | 'publish' | 'pending' | 'private';
    categories?: number[];
    tags?: number[];
    featured_media?: number;
    meta?: {
      seo_title?: string;
      seo_description?: string;
      seo_keywords?: string;
      canonical_url?: string;
      og_title?: string;
      og_description?: string;
      og_image?: string;
      twitter_title?: string;
      twitter_description?: string;
      twitter_image?: string;
    };
  }) => {
    return apiCall<any>('/blog/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Update post
  updatePost: async (postId: string | number, postData: any) => {
    return apiCall<any>(`/blog/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  // Delete post
  deletePost: async (postId: string | number, force = false) => {
    return apiCall<any>(`/blog/posts/${postId}?force=${force}`, {
      method: 'DELETE',
    });
  },

  // Get categories
  getCategories: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    hide_empty?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      categories: any[];
      pagination?: any;
    }>(`/blog/categories?${searchParams.toString()}`);
  },

  // Create category
  createCategory: async (categoryData: {
    name: string;
    description?: string;
    slug?: string;
    parent?: number;
  }) => {
    return apiCall<any>('/blog/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Update category
  updateCategory: async (categoryId: string | number, categoryData: any) => {
    return apiCall<any>(`/blog/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Delete category
  deleteCategory: async (categoryId: string | number, force = false) => {
    return apiCall<any>(`/blog/categories/${categoryId}?force=${force}`, {
      method: 'DELETE',
    });
  },

  // Get tags
  getTags: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    hide_empty?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      tags: any[];
      pagination?: any;
    }>(`/blog/tags?${searchParams.toString()}`);
  },

  // Create tag
  createTag: async (tagData: {
    name: string;
    description?: string;
    slug?: string;
  }) => {
    return apiCall<any>('/blog/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  },

  // Upload media
  uploadMedia: async (file: File, alt_text?: string) => {
    console.log("uploadMedia called with:", { fileName: file.name, fileSize: file.size, fileType: file.type, alt_text });
    
    const formData = new FormData();
    formData.append('file', file);
    if (alt_text) {
      formData.append('alt_text', alt_text);
    }

    console.log("Uploading to:", `${API_BASE_URL}/blog/media`);
    console.log("FormData contents:", Array.from(formData.entries()));

    try {
      const response = await fetch(`${API_BASE_URL}/blog/media`, {
        method: 'POST',
        body: formData,
      });

      console.log("Upload response status:", response.status);
      console.log("Upload response headers:", response.headers);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload error' }));
        console.error("Upload error response:", error);
        throw new Error(error.error || 'Upload Error');
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      return result;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  // Get media
  getMedia: async (params?: {
    page?: number;
    per_page?: number;
    media_type?: string;
    mime_type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<{
      media: any[];
      pagination?: any;
    }>(`/blog/media?${searchParams.toString()}`);
  },

  // Get single media file
  getMediaById: async (mediaId: string | number) => {
    return apiCall<any>(`/blog/media/${mediaId}`);
  },

  // Get comments
  getComments: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: 'approved' | 'hold' | 'spam' | 'trash' | 'all';
    post?: number;
    author_email?: string;
    after?: string;
    before?: string;
    order?: 'asc' | 'desc';
    orderby?: 'date' | 'date_gmt' | 'id' | 'post' | 'parent';
    parent?: number;
    _embed?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    
    return apiCall<{
      comments: any[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>(`/blog/comments?${searchParams.toString()}`);
  },

  // Get single comment
  getComment: async (commentId: string | number) => {
    return apiCall<any>(`/blog/comments/${commentId}`);
  },

  // Update comment
  updateComment: async (commentId: string | number, commentData: {
    status?: 'approved' | 'hold' | 'spam' | 'trash';
    content?: string;
    author_name?: string;
    author_email?: string;
    author_url?: string;
  }) => {
    return apiCall<any>(`/blog/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
  },

  // Delete comment
  deleteComment: async (commentId: string | number, force = false) => {
    return apiCall<any>(`/blog/comments/${commentId}?force=${force}`, {
      method: 'DELETE',
    });
  },

  // Approve comment
  approveComment: async (commentId: string | number) => {
    return apiCall<any>(`/blog/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
    });
  },

  // Reject comment (mark as hold)
  rejectComment: async (commentId: string | number) => {
    return apiCall<any>(`/blog/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'hold' }),
    });
  },

  // Mark comment as spam
  markCommentAsSpam: async (commentId: string | number) => {
    return apiCall<any>(`/blog/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'spam' }),
    });
  },

  // Get comment counts by status (optional - fallback to client-side calculation)
  getCommentCounts: async () => {
    return await apiCall<{
      approved: number;
      hold: number;
      spam: number;
      trash: number;
      total: number;
    }>('/blog/comments/counts');
  },

  // Bulk update comments (optional - fallback to individual updates)
  bulkUpdateComments: async (commentIds: number[], action: 'approve' | 'hold' | 'spam' | 'trash' | 'delete') => {
    try {
      return await apiCall<any>('/blog/comments/bulk', {
        method: 'POST',
        body: JSON.stringify({
          comment_ids: commentIds,
          action: action,
        }),
      });
    } catch (error) {
      // If bulk endpoint doesn't exist, fall back to individual updates
      const results = [];
      for (const commentId of commentIds) {
        try {
          let result;
          switch (action) {
            case 'approve':
              result = await blogApi.approveComment(commentId);
              break;
            case 'hold':
              result = await blogApi.rejectComment(commentId);
              break;
            case 'spam':
              result = await blogApi.markCommentAsSpam(commentId);
              break;
            case 'trash':
              result = await blogApi.updateComment(commentId, { status: 'trash' });
              break;
            case 'delete':
              result = await blogApi.deleteComment(commentId, true);
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          results.push(result);
        } catch (err) {
          // Silently continue with other comments if one fails
          results.push({ error: `Failed to ${action} comment ${commentId}` });
        }
      }
      return { success: true, results };
    }
  },

  // Reply to comment (optional - may not be implemented yet)
  replyToComment: async (commentId: string | number, replyData: {
    content: string;
    author_name?: string;
    author_email?: string;
  }) => {
    try {
      return await apiCall<any>(`/blog/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify(replyData),
      });
    } catch (error) {
      throw new Error('La funcionalidad de respuestas no está disponible aún');
    }
  },
};

// Categories API
export const categoriesApi = {
  // Get categories
  getCategories: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    parent?: number;
    orderby?: string;
    order?: string;
    hide_empty?: boolean;
    format?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<any>(`/categories?${searchParams.toString()}`);
  },

  // Get single category
  getCategory: async (categoryId: string | number) => {
    return apiCall<any>(`/categories/${categoryId}`);
  },

  // Create category
  createCategory: async (categoryData: any) => {
    return apiCall<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Update category
  updateCategory: async (categoryId: string | number, categoryData: any) => {
    return apiCall<any>(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Delete category
  deleteCategory: async (categoryId: string | number, force = false) => {
    return apiCall<any>(`/categories/${categoryId}?force=${force}`, {
      method: 'DELETE',
    });
  },

  // Get categories hierarchy
  getCategoriesHierarchy: async () => {
    return apiCall<any>('/categories/hierarchy');
  },

  // Bulk delete categories
  bulkDeleteCategories: async (categoryIds: number[], force = false) => {
    return apiCall<any>('/categories/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ 
        category_ids: categoryIds,
        force: force 
      }),
    });
  },
};

// Inventory API
export interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  low_stock_amount: number | null;
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ id: number; name: string }>;
  type: string;
  status: string;
}

export interface InventoryStats {
  total_products: number;
  in_stock: number;
  out_of_stock: number;
  low_stock: number;
  total_stock_value: number;
}

export interface InventoryResponse {
  products: InventoryProduct[];
  total: number;
  page: number;
  per_page: number;
}

export interface BulkUpdateRequest {
  products: Array<{ id: number; [key: string]: any }>;
  update_type: string;
}

export interface BulkUpdateResponse {
  success: number;
  errors: number;
  results: Array<{ id: number; success: boolean; data?: any }>;
  error_details: Array<{ id: number | string; error: string }>;
}

export const inventoryApi = {
  // Get inventory with filters
  getInventory: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    stock_status?: string;
    low_stock?: boolean;
  }): Promise<InventoryResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.stock_status) searchParams.append('stock_status', params.stock_status);
    if (params?.low_stock) searchParams.append('low_stock', 'true');
    
    const url = `/inventory${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return apiCall<InventoryResponse>(url);
  },

  // Get inventory statistics
  getInventoryStats: async (): Promise<InventoryStats> => {
    return apiCall<InventoryStats>('/inventory/stats');
  },

  // Update single product
  updateProduct: async (productId: number, updateData: Partial<InventoryProduct>): Promise<InventoryProduct> => {
    return apiCall<InventoryProduct>(`/inventory/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Bulk update products
  bulkUpdateProducts: async (bulkData: BulkUpdateRequest): Promise<BulkUpdateResponse> => {
    return apiCall<BulkUpdateResponse>('/inventory/bulk-update', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },

  // Get low stock products
  getLowStockProducts: async (): Promise<{ products: InventoryProduct[]; total: number }> => {
    return apiCall<{ products: InventoryProduct[]; total: number }>('/inventory/low-stock');
  },

  // Get out of stock products
  getOutOfStockProducts: async (): Promise<{ products: InventoryProduct[]; total: number }> => {
    return apiCall<{ products: InventoryProduct[]; total: number }>('/inventory/out-of-stock');
  },
};

 