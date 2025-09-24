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
import { getDivePackages } from "@/services/divePackages";
import { DivePackage } from "@/types/contractTypes";

export default function DivePackageSelectionForm({
  hotelId,
  onNext,
  onBack,
  initialDivePackageId = "",
  initialNumDivers = 0,
}: {
  hotelId: string;
  onNext: (data: { divePackageId: string; numDivers: number }) => void;
  onBack: () => void;
  initialDivePackageId?: string;
  initialNumDivers?: number;
}) {
  const [divePackages, setDivePackages] = useState<DivePackage[]>([]);
  const [divePackageId, setDivePackageId] = useState(initialDivePackageId);
  const [numDivers, setNumDivers] = useState(initialNumDivers);

  useEffect(() => {
    const fetchData = async () => {
      const packages = await getDivePackages();
      setDivePackages(packages);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (initialDivePackageId) setDivePackageId(initialDivePackageId || "");
  }, [initialDivePackageId]);

  useEffect(() => {
    if (initialNumDivers) setNumDivers(initialNumDivers || 0);
  }, [initialNumDivers]);

  const handleSubmit = () => {
    const validDivers = Number.isFinite(numDivers) && numDivers > 0;
    if (!divePackageId || !validDivers) {
      alert("Please select a dive package and enter a valid number of divers.");
      return;
    }
    // console.log("Submitting form with divePackageId: ", divePackageId, ", numDivers: ", numDivers);
    onNext({ divePackageId, numDivers });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Select Dive Package
      </Text>
      <FormControl isRequired>
        <FormLabel>Dive Package</FormLabel>
        <Select
          key={divePackageId.length} // Force re-render when divePackageId changes
          value={divePackageId}
          onChange={(e) => setDivePackageId(e.target.value)}
        >
          <option value="">Select a dive package</option>
          {divePackages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </Select>
        {/* Optional: show description or notes below */}
        {divePackageId && (
          <Text fontSize="sm" color="gray.600">
            {divePackages.find((pkg) => pkg.id === divePackageId)?.description}
          </Text>
        )}
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Number of Divers</FormLabel>
        <Input
          type="number"
          min={1}
          value={numDivers}
          onChange={(e) => setNumDivers(parseInt(e.target.value) || 0)}
        />
      </FormControl>

      <HStack spacing={2}>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme="teal" onClick={handleSubmit} flex={1}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
}
