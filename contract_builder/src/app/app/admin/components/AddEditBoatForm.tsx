'use client'

import {useEffect, useState} from "react";
import {Box, Button, FormControl, FormLabel, HStack, Input, Switch, VStack,} from "@chakra-ui/react";
import {Boat} from "@/app/app/dive-log/_types";

interface AddEditBoatFormProps {
  boat?: Boat;
  onSave: (data: Omit<Boat, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export default function AddEditBoatForm({boat, onSave, onCancel}: AddEditBoatFormProps) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (boat) {
      setName(boat.name);
      setActive(boat.active);
    }
  }, [boat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({name, active});
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Boat Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter boat name"
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Active</FormLabel>
            <Switch isChecked={active} onChange={(e) => setActive(e.target.checked)}/>
          </FormControl>

          <HStack spacing={4}>
            <Button type="submit" colorScheme="teal" flex="1">
              {boat ? "Update Boat" : "Add Boat"}
            </Button>
            <Button onClick={onCancel} colorScheme="gray" flex="1">
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}
