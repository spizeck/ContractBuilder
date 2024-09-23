"use client";

import {useState} from "react";
import {Button, Heading, Text, VStack} from "@chakra-ui/react";
import {CreateContractForm} from "@/components/CreateContractForm";

export default function ContractPage() {
  const [action, setAction] = useState<null | "create" | "edit">(null);

  return (
    <VStack spacing={2} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        Group Contracts
      </Heading>

      {!action && (
        <>
          <VStack spacing={4} p={5} align="stretch">
            <Text fontSize="lg">What would you like to do?</Text>
            <Button colorScheme="teal" size="lg" onClick={() => setAction("create")}>
              Create New Contract
            </Button>
            <Button colorScheme="blue" size="lg" onClick={() => setAction("edit")}>
              View/Edit Existing Contract
            </Button>
          </VStack>
        </>
      )}

      {action === "create" && <CreateContractForm/>}
      {/* Placeholder for EditContractForm when action === "edit" */}
    </VStack>
  );
}
