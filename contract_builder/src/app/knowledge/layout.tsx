import { Metadata } from "next";
import { Container, Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Knowledge Base | Sea Saba Business App",
  description: "Comprehensive resource for Sea Saba operations, protocols, and best practices",
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box minH="full">
      <Container maxW="container.xl" py={4}>
        <Breadcrumb
          spacing={2}
          separator={<ChevronRightIcon color="gray.500" />}
          fontSize="sm"
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Knowledge Base</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Container>
      
      {children}
    </Box>
  );
}
