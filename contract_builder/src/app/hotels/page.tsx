"use client";

import { useState } from "react";
import { Button, VStack, Heading, Text } from "@chakra-ui/react";
import { CreateContractForm } from "@/components/CreateContractForm";
import AddHotelForm from "@/components/AddHotelForm";

export default function HotelsPage() {
  const [action, setAction] = useState<null | "create" | "edit">(null);

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        Add / Edit Hotels
      </Heading>

      {!action && (
        <>
          <Text fontSize="lg">What would you like to do?</Text>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("create")}>
            Add New Hotel
          </Button>
          <Button colorScheme="blue" size="lg" onClick={() => setAction("edit")}>
            View/Edit Existing Hotels
          </Button>
        </>
      )}

      {action === "create" && <AddHotelForm />}
      {/* Placeholder for EditContractForm when action === "edit" */}
    </VStack>
  );
}
