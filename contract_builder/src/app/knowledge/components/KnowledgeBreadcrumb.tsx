"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import Link from "next/link";

export default function KnowledgeBreadcrumb() {
  return (
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
  );
}
