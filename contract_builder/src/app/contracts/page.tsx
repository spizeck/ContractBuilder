"use client";

import { useState } from "react";
import { Button, VStack, Heading, Text } from "@chakra-ui/react";
import { CreateContractForm } from "@/components/CreateContractForm";

export default function ContractPage() {
  const [action, setAction] = useState<null | "create" | "edit">(null);

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        Group Contracts
      </Heading>

      {!action && (
        <>
          <Text fontSize="lg">What would you like to do?</Text>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("create")}>
            Create New Contract
          </Button>
          <Button colorScheme="blue" size="lg" onClick={() => setAction("edit")}>
            View/Edit Existing Contract
          </Button>
        </>
      )}

      {action === "create" && <CreateContractForm />}
      {/* Placeholder for EditContractForm when action === "edit" */}
    </VStack>
  );
}
