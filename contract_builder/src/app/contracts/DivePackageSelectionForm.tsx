import { useState, useEffect } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  Text,
  HStack,
} from "@chakra-ui/react";
import { DivePackage, getDivePackages } from "@/services/divePackages";

export default function DivePackageSelectionForm({
  hotelId,
  onNext,
  onBack,
}: {
  hotelId: string;
  onNext: (data: { divePackageId: string; numDivers: number }) => void;
  onBack: () => void;
}) {
  const [divePackages, setDivePackages] = useState<DivePackage[]>([]);
  const [divePackageId, setDivePackageId] = useState("");
  const [numDivers, setNumDivers] = useState(0);

  useEffect(() => {
    fetchDivePackages();
  }, []);

  const fetchDivePackages = async () => {
    const packages = await getDivePackages();
    setDivePackages(packages);
  };

  const handleSubmit = () => {
    // Validate inputs
    if (!divePackageId || numDivers <= 0) {
      alert("Please select a dive package and enter the number of divers.");
      return;
    }
    onNext({ divePackageId, numDivers });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Select Dive Package
      </Text>
      <FormControl isRequired>
        <FormLabel>Dive Package</FormLabel>
        <Select value={divePackageId} onChange={(e) => setDivePackageId(e.target.value)}>
          <option value="">Select a dive package</option>
          {divePackages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Number of Divers</FormLabel>
        <Input
          type="number"
          value={numDivers}
          onChange={(e) => setNumDivers(parseInt(e.target.value))}
        />
      </FormControl>
      <HStack spacing={2}>
        <Button onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={handleSubmit}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
}
