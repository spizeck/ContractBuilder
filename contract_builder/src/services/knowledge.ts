import { KnowledgeArticle, KnowledgeCategory, KnowledgeSearchResult, KnowledgeBaseResponse } from "@/types/knowledge";

const KNOWLEDGE_BASE_URL = "https://sea-saba-knowledge-base.web.app";

// ---- API HELPERS ----

async function fetchFromKnowledgeBase(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${KNOWLEDGE_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from knowledge base: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Knowledge base API error:", error);
    throw error;
  }
}

// ---- CONTENT FETCHING ----

/**
 * Fetch all knowledge base articles
 */
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  try {
    // Try API first, fallback to sitemap parsing
    return await fetchFromKnowledgeBase("/api/articles");
  } catch (error) {
    console.log("API not available, using fallback method");
    return await getKnowledgeArticlesFallback();
  }
}

/**
 * Fetch a specific article by path
 */
export async function getKnowledgeArticle(path: string): Promise<KnowledgeArticle | null> {
  try {
    const article = await fetchFromKnowledgeBase(`/api/article${path}`);
    return article;
  } catch (error) {
    console.error(`Failed to fetch article ${path}:`, error);
    return null;
  }
}

/**
 * Fetch knowledge base categories with their articles
 */
export async function getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  try {
    return await fetchFromKnowledgeBase("/api/categories");
  } catch (error) {
    console.log("Categories API not available, returning empty");
    return [];
  }
}

/**
 * Search knowledge base content
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeSearchResult[]> {
  if (!query.trim()) return [];
  
  try {
    const results = await fetchFromKnowledgeBase(`/api/search?q=${encodeURIComponent(query)}`);
    return results;
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

/**
 * Get featured/popular articles
 */
export async function getFeaturedArticles(): Promise<KnowledgeArticle[]> {
  try {
    return await fetchFromKnowledgeBase("/api/featured");
  } catch (error) {
    console.log("Featured API not available, returning empty");
    return [];
  }
}

/**
 * Get recently updated articles
 */
export async function getRecentArticles(): Promise<KnowledgeArticle[]> {
  try {
    return await fetchFromKnowledgeBase("/api/recent");
  } catch (error) {
    console.log("Recent API not available, returning empty");
    return [];
  }
}

// ---- FALLBACK METHODS ----

/**
 * Fallback method to handle API unavailability
 * Returns empty arrays to avoid showing misleading demo content
 */
export async function getKnowledgeArticlesFallback(): Promise<KnowledgeArticle[]> {
  console.log("Knowledge base API unavailable - returning empty results");
  return [];
}

// ---- UTILITIES ----

/**
 * Format article URL for external linking
 */
export function getArticleUrl(article: KnowledgeArticle): string {
  return `${KNOWLEDGE_BASE_URL}${article.path}`;
}

/**
 * Create a search-friendly excerpt from content
 */
export function createExcerpt(content: string, maxLength: number = 150): string {
  const cleanContent = content.replace(/[#*`_~]/g, '').replace(/\n+/g, ' ').trim();
  if (cleanContent.length <= maxLength) return cleanContent;
  
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}
