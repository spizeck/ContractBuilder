// components/diveForm/steps/StepDiveInfo.tsx
"use client";

import {
  Box,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  VStack,
  Heading,
  Progress,
  Flex,
} from "@chakra-ui/react";
import DatePicker from "@shared/components/DatePicker";
import { Boat, DiveSlot, Guide, Site } from "@/app/app/dive-log/_types";

interface StepDiveInfoProps {
  date: string;
  diveSlot: DiveSlot;
  boatId: string;
  diveGuide: string;
  diveSiteId: string;
  maxDepth: number;
  waterTemperature: number;
  boats: Boat[];
  sites: Site[];
  guides: Guide[];
  prefs: any;
  progressValue: number;
  depthLabel: string;
  tempLabel: string;
  displayDepth: number;
  displayTemp: number;
  onChange: {
    setDate: (v: string) => void;
    setDiveSlot: (v: DiveSlot) => void;
    setBoatId: (v: string) => void;
    setDiveGuide: (v: string) => void;
    setDiveSiteId: (v: string) => void;
    handleDepthChange: (_: string, v: number) => void;
    handleTempChange: (_: string, v: number) => void;
  };
}

export function StepDiveInfo({
  date,
  diveSlot,
  boatId,
  diveGuide,
  diveSiteId,
  boats,
  sites,
  guides,
  prefs,
  progressValue,
  depthLabel,
  tempLabel,
  displayDepth,
  displayTemp,
  onChange,
}: StepDiveInfoProps) {
  return (
    <Flex
      direction="column"
      justify="space-between"
      minH={{ base: "75vh", md: "auto" }}
      maxH={{ base: "85vh", md: "none" }}
      p={{ base: 3, md: 4 }}
    >
      <Box flexShrink={0}>
        <Heading size="lg" mb={{ base: 2, md: 4 }}>
          New Dive
        </Heading>
        <Progress value={progressValue} mb={4} colorScheme="teal" />
      </Box>

      <Box flex="1" overflowY="auto" pr={1} pb={4}>
        <VStack spacing={{ base: 2, md: 4 }} align="stretch">
          <FormControl isRequired>
            <FormLabel>Date</FormLabel>
            <DatePicker
              value={date}
              onChange={(v: string | null) => onChange.setDate(v ?? "")}
              placeholder="Select date"
              isClearable={false}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Dive Time</FormLabel>
            <Select
              value={diveSlot}
              onChange={(e) => onChange.setDiveSlot(e.target.value as DiveSlot)}
            >
              <option value="">Select time</option>
              <option value="9am">9am Dive</option>
              <option value="11am">11am Dive</option>
              <option value="1pm">1pm Dive</option>
              <option value="4pm">4pm Dive</option>
              <option value="night">Night Dive</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Boat</FormLabel>
            <Select
              value={boatId}
              onChange={(e) => onChange.setBoatId(e.target.value)}
            >
              <option value="">Select boat</option>
              {boats.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Dive Guide</FormLabel>
            <Select
              value={diveGuide}
              onChange={(e) => onChange.setDiveGuide(e.target.value)}
            >
              <option value="">Select guide</option>
              {guides
                .filter((g) => g.active)
                .map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Dive Site</FormLabel>
            <Select
              value={diveSiteId}
              onChange={(e) => onChange.setDiveSiteId(e.target.value)}
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>{depthLabel}</FormLabel>
            <NumberInput
              min={1}
              max={prefs?.units.depth === "feet" ? 330 : 100}
              value={Number.isFinite(displayDepth) ? displayDepth : 0}
              onChange={onChange.handleDepthChange}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>{tempLabel}</FormLabel>
            <NumberInput
              min={prefs?.units.temp === "fahrenheit" ? 40 : 5}
              max={prefs?.units.temp === "fahrenheit" ? 110 : 40}
              value={Number.isFinite(displayTemp) ? displayTemp : 0}
              onChange={onChange.handleTempChange}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
        </VStack>
      </Box>
    </Flex>
  );
}
