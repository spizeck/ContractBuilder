'use client'

import {useEffect, useState} from "react";
import {Box, Button, FormControl, FormLabel, HStack, Input, Select, Switch, VStack} from "@chakra-ui/react";
import {Species} from "@/app/app/dive-log/_types";

interface Props {
  species?: Species;
  onSave: (data: Omit<Species, "id">) => void;
  onCancel: () => void;
}

export default function AddEditSpeciesForm({species, onSave, onCancel}: Props) {
  const [name, setName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [category, setCategory] = useState("");
  const [step, setStep] = useState<number | undefined>(undefined);
  const [iucnStatus, setIucnStatus] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (species) {
      setName(species.name);
      setScientificName(species.scientificName || "");
      setCategory(species.category || "");
      setStep(species.step);
      setIucnStatus(species.iucnStatus || "");
      setActive(species.active);
    }
  }, [species]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({name, scientificName, category, step, iucnStatus, active});
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Species Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Scientific Name</FormLabel>
            <Input value={scientificName} onChange={(e) => setScientificName(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Category</FormLabel>
            <Input value={category} onChange={(e) => setCategory(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Step (form grouping)</FormLabel>
            <Select value={step || ""} onChange={(e) => setStep(Number(e.target.value))}>
              <option value="">None</option>
              <option value="1">Step 1</option>
              <option value="2">Step 2</option>
              <option value="3">Step 3</option>
              <option value="4">Step 4</option>
              <option value="5">Step 5</option>
              <option value="6">Step 6</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>IUCN Status</FormLabel>
            <Input value={iucnStatus} onChange={(e) => setIucnStatus(e.target.value)}/>
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Active</FormLabel>
            <Switch isChecked={active} onChange={(e) => setActive(e.target.checked)}/>
          </FormControl>
          <HStack>
            <Button type="submit" colorScheme="teal" flex="1">
              {species ? "Update Species" : "Add Species"}
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
