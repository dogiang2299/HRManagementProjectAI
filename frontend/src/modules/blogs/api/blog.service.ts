import axios from "axios";
import { BASE_URL } from "../../../constant/config";

const blogPublicClient = axios.create({
  baseURL: BASE_URL,
  timeout: 1000 * 60,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  thumbnail_url?: string;
  category?: string;
  content?: string;
  summary?: string;
  author_name?: string;
  read_time?: number;
  published_at?: string;
}

export interface BlogListParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface BlogListResponse {
  data: BlogPost[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Get list of blog posts with full response including total count
 */
export const getBlogs = async (
  params?: BlogListParams
): Promise<BlogListResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append("search", params.search);
    if (params?.category && params.category !== "All") {
      queryParams.append("category", params.category);
    }
    // Default to page 1, limit 50 to fetch more articles
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const response = await blogPublicClient.get<BlogListResponse>(
      `/blog-posts?${queryParams.toString()}`
    );

    const responseData = response.data;
    return {
      data: responseData?.data || [],
      total: responseData?.total,
      page: responseData?.page || page,
      limit: responseData?.limit || limit,
    };
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    throw error;
  }
};

/**
 * Get a single blog post by slug
 */
export const getBlogBySlug = async (slug: string): Promise<BlogPost> => {
  try {
    const response = await blogPublicClient.get<{ data: BlogPost }>(`/blog-posts/${slug}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch blog post with slug "${slug}":`, error);
    throw error;
  }
};
