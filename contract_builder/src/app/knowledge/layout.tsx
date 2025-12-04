import { Metadata } from "next";
import { Container, Box } from "@chakra-ui/react";
import KnowledgeBreadcrumb from "./components/KnowledgeBreadcrumb";

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
        <KnowledgeBreadcrumb />
      </Container>
      
      {children}
    </Box>
  );
}
