"use client";

import { useState } from "react";
import { Button, Heading, Text, VStack } from "@chakra-ui/react";
import GroupContractWizard from "./GroupContractWizard";
import GroupContractsList from "./GroupContractsList";

export default function ContractPage() {
  const [view, setView] = useState<"home" | "add" | "list">("home");

  const handleAddContract = () => {
    setView("add");
  };

  const handleViewEditContracts = () => {
    setView("list");
  };

  const handleBackToHome = () => {
    setView("home");
  };

  return (
    <VStack spacing={4} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        Group Contracts
      </Heading>

      {view === "home" && (
        <VStack spacing={4} p={5} align="stretch">
          <Text fontSize="lg">What would you like to do?</Text>
          <Button colorScheme="teal" size="lg" onClick={handleAddContract}>
            Create New Contract
          </Button>
          <Button colorScheme="blue" size="lg" onClick={handleViewEditContracts}>
            View/Edit Existing Contracts
          </Button>
        </VStack>
      )}

      {view === "add" && <GroupContractWizard onCancel={handleBackToHome} />}

      {view === "list" && (
        <GroupContractsList
          onBack={handleBackToHome}
          onCreateNew={handleAddContract}
        />
      )}
    </VStack>
  );
}
