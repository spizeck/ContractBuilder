'use client'

import {useEffect, useState} from "react";
import {Box, Button, FormControl, FormLabel, HStack, Input, Switch, VStack, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, NumberInput, NumberInputField, NumberInputStepper, NumberDecrementStepper, NumberIncrementStepper, Text,} from "@chakra-ui/react";
import {Boat} from "@/types/diveLogTypes";

interface AddEditBoatFormProps {
  boat?: Boat;
  onSave: (data: Omit<Boat, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export default function AddEditBoatForm({boat, onSave, onCancel}: AddEditBoatFormProps) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  
  // Manifest configuration fields
  const [capacity, setCapacity] = useState(12);
  const [maxDiveSlots, setMaxDiveSlots] = useState<1 | 2 | 3 | 4>(4);
  const [slot1Time, setSlot1Time] = useState("09:00");
  const [slot2Time, setSlot2Time] = useState("11:00");
  const [slot3Time, setSlot3Time] = useState("13:00");
  const [slot4Time, setSlot4Time] = useState("18:00");

  useEffect(() => {
    if (boat) {
      setName(boat.name);
      setActive(boat.active);
      setCapacity(boat.capacity || 12);
      setMaxDiveSlots(boat.maxDiveSlots || 4);
      setSlot1Time(boat.defaultDiveTimes?.slot1 || "09:00");
      setSlot2Time(boat.defaultDiveTimes?.slot2 || "11:00");
      setSlot3Time(boat.defaultDiveTimes?.slot3 || "13:00");
      setSlot4Time(boat.defaultDiveTimes?.slot4 || "18:00");
    }
  }, [boat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name, 
      active,
      capacity,
      maxDiveSlots,
      defaultDiveTimes: {
        slot1: slot1Time,
        slot2: slot2Time,
        slot3: slot3Time,
        slot4: slot4Time,
      },
    });
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

          {/* Manifest Configuration - Collapsible Section */}
          <Accordion allowToggle>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="bold">Advanced: Manifest Configuration</Text>
                    <Text fontSize="sm" color="textMuted">
                      Configure boat settings for daily manifest generation
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Maximum Divers</FormLabel>
                    <NumberInput 
                      value={capacity} 
                      onChange={(value) => setCapacity(parseInt(value) || 12)}
                      min={1}
                      max={50}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Maximum Dive Slots per Day</FormLabel>
                    <NumberInput 
                      value={maxDiveSlots} 
                      onChange={(value) => setMaxDiveSlots((parseInt(value) || 4) as 1 | 2 | 3 | 4)}
                      min={1}
                      max={4}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <Text fontWeight="bold" mt={2}>Default Dive Times</Text>
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Slot 1</FormLabel>
                      <Input 
                        type="time"
                        value={slot1Time}
                        onChange={(e) => setSlot1Time(e.target.value)}
                        placeholder="09:00"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Slot 2</FormLabel>
                      <Input 
                        type="time"
                        value={slot2Time}
                        onChange={(e) => setSlot2Time(e.target.value)}
                        placeholder="11:00"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Slot 3</FormLabel>
                      <Input 
                        type="time"
                        value={slot3Time}
                        onChange={(e) => setSlot3Time(e.target.value)}
                        placeholder="13:00"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Night Dive</FormLabel>
                      <Input 
                        type="time"
                        value={slot4Time}
                        onChange={(e) => setSlot4Time(e.target.value)}
                        placeholder="18:00"
                      />
                    </FormControl>
                  </HStack>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

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
