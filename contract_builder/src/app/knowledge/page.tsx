"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { SearchIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { KnowledgeArticle, KnowledgeCategory } from "@/types/knowledge";
import {
  getKnowledgeArticles,
  getKnowledgeCategories,
  getFeaturedArticles,
  getArticleUrl,
} from "@/services/knowledge";

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [articlesData, categoriesData, featuredData] = await Promise.all([
        getKnowledgeArticles(),
        getKnowledgeCategories(),
        getFeaturedArticles(),
      ]);

      setArticles(articlesData);
      setCategories(categoriesData);
      setFeaturedArticles(featuredData);
    } catch (err) {
      console.error("Failed to load knowledge base:", err);
      setError("Failed to load knowledge base. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} align="center">
          <Spinner size="xl" />
          <Text>Loading knowledge base...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="2xl" mb={4}>
            Knowledge Base
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Your comprehensive resource for Sea Saba operations, protocols, and best practices
          </Text>
          
          {/* Search */}
          <InputGroup maxW="2xl" mx="auto">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
            />
          </InputGroup>
        </Box>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && !searchQuery && (
          <Box>
            <Heading size="lg" mb={4}>Featured Articles</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {featuredArticles.map((article) => (
                <Card key={article.id} bg={cardBg} variant="outline">
                  <CardHeader>
                    <HStack justify="space-between" align="start">
                      <Heading size="sm" noOfLines={2}>
                        {article.title}
                      </Heading>
                      <Badge colorScheme="blue">Featured</Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Text noOfLines={3} mb={4}>
                      {article.excerpt}
                    </Text>
                    <Button
                      as="a"
                      href={getArticleUrl(article)}
                      target="_blank"
                      rel="noopener noreferrer"
                      rightIcon={<ExternalLinkIcon />}
                      size="sm"
                      variant="outline"
                    >
                      Read More
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Categories */}
        {categories.length > 0 && !searchQuery && (
          <Box>
            <Heading size="lg" mb={4}>Categories</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {categories.map((category) => (
                <Card key={category.name} bg={cardBg} variant="outline">
                  <CardHeader>
                    <Heading size="sm">{category.name}</Heading>
                    <Text fontSize="xs" color="gray.500">
                      {category.articles.length} articles
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      {category.articles.slice(0, 3).map((article) => (
                        <Button
                          key={article.id}
                          as="a"
                          href={getArticleUrl(article)}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                        >
                          {article.title}
                        </Button>
                      ))}
                      {category.articles.length > 3 && (
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          +{category.articles.length - 3} more articles
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Search Results or All Articles */}
        <Box>
          <Heading size="lg" mb={4}>
            {searchQuery ? `Search Results (${filteredArticles.length})` : "All Articles"}
          </Heading>
          
          {filteredArticles.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">
                {searchQuery ? "No articles found matching your search." : "No articles available."}
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredArticles.map((article) => (
                <Card key={article.id} bg={cardBg} variant="outline">
                  <CardHeader>
                    <Heading size="sm" noOfLines={2}>
                      {article.title}
                    </Heading>
                    {article.category && (
                      <Badge colorScheme="gray" variant="subtle">
                        {article.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardBody>
                    <Text noOfLines={3} mb={4}>
                      {article.excerpt}
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.500">
                        {new Date(article.lastModified).toLocaleDateString()}
                      </Text>
                      <Button
                        as="a"
                        href={getArticleUrl(article)}
                        target="_blank"
                        rel="noopener noreferrer"
                        rightIcon={<ExternalLinkIcon />}
                        size="sm"
                        variant="outline"
                      >
                        Read More
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
