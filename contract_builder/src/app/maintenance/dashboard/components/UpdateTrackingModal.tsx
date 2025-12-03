"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Asset } from "@/types/maintenance";
import { updateAsset } from "@/services/assets";
import { isHoursTracked, isKmTracked } from "@/types/maintenance";

export default function UpdateTrackingModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentHours, setCurrentHours] = useState<string>("");
  const [currentKilometers, setCurrentKilometers] = useState<string>("");
  const toast = useToast();

  // Dynamic colors for light/dark modes
  const cardBg = useColorModeValue("white", "gray.800");
  const cardText = useColorModeValue("gray.900", "gray.100");

  // Reset form when asset changes
  useState(() => {
    if (asset && isOpen) {
      if (isHoursTracked(asset)) {
        setCurrentHours(asset.currentHours?.toString() || "");
      } else if (isKmTracked(asset)) {
        setCurrentKilometers(asset.currentKilometers?.toString() || "");
      }
    }
  });

  const handleSubmit = async () => {
    if (!asset) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {};

      if (isHoursTracked(asset)) {
        const hours = parseFloat(currentHours);
        if (isNaN(hours) || hours < 0) {
          toast({
            title: "Invalid input",
            description: "Please enter a valid number for hours",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        updateData.currentHours = hours;
      } else if (isKmTracked(asset)) {
        const km = parseFloat(currentKilometers);
        if (isNaN(km) || km < 0) {
          toast({
            title: "Invalid input",
            description: "Please enter a valid number for kilometers",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        updateData.currentKilometers = km;
      }

      await updateAsset(asset.id, updateData);
      
      toast({
        title: "Success",
        description: `Updated ${isHoursTracked(asset) ? "hours" : "kilometers"} for ${asset.name}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update tracking:", error);
      toast({
        title: "Error",
        description: "Failed to update tracking information",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  const isHours = isHoursTracked(asset);
  const isKm = isKmTracked(asset);

  // Only show modal for hours or kilometers tracked assets
  if (!isHours && !isKm) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg={cardBg} color={cardText}>
        <ModalHeader>
          Update {isHours ? "Hours" : "Kilometers"} — {asset.name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Update the current {isHours ? "hours" : "kilometers"} for this asset.
            </Text>
            
            {isHours && (
              <FormControl>
                <FormLabel>Current Hours</FormLabel>
                <NumberInput
                  value={currentHours}
                  onChange={(value) => setCurrentHours(value)}
                  min={0}
                  step={0.1}
                  precision={1}
                >
                  <NumberInputField />
                  <NumberInputStepper />
                </NumberInput>
              </FormControl>
            )}

            {isKm && (
              <FormControl>
                <FormLabel>Current Kilometers</FormLabel>
                <NumberInput
                  value={currentKilometers}
                  onChange={(value) => setCurrentKilometers(value)}
                  min={0}
                  step={1}
                  precision={0}
                >
                  <NumberInputField />
                  <NumberInputStepper />
                </NumberInput>
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!currentHours && !currentKilometers}
          >
            Update {isHours ? "Hours" : "Kilometers"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
