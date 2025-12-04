export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  path: string;
  lastModified: string;
  tags?: string[];
  category?: string;
}

export interface KnowledgeCategory {
  name: string;
  path: string;
  articles: KnowledgeArticle[];
}

export interface KnowledgeSearchResult {
  article: KnowledgeArticle;
  score: number;
  matchedContent: string;
}

export interface KnowledgeBaseResponse {
  articles: KnowledgeArticle[];
  categories: KnowledgeCategory[];
  totalArticles: number;
}
