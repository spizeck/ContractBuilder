'use client'

import {useEffect, useState} from "react";
import {Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Switch, VStack} from "@chakra-ui/react";
import {Site} from "@/app/(staff)/dive-log/_types";

interface Props {
  site?: Site;
  onSave: (data: Omit<Site, "id">) => void;
  onCancel: () => void;
}

export default function AddEditSiteForm({site, onSave, onCancel}: Props) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [habitatType, setHabitatType] = useState("");
  const [depthRange, setDepthRange] = useState("");
  const [protectedArea, setProtectedArea] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (site) {
      setName(site.name);
      setRegion(site.region || "");
      setHabitatType(site.habitatType || "");
      setDepthRange(site.depthRange || "");
      setProtectedArea(site.protectedArea || false);
      setActive(site.active);
    }
  }, [site]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({name, region, habitatType, depthRange, protectedArea, active});
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Site Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Region</FormLabel>
            <Input value={region} onChange={(e) => setRegion(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Habitat Type</FormLabel>
            <Input value={habitatType} onChange={(e) => setHabitatType(e.target.value)}/>
          </FormControl>
          <FormControl>
            <FormLabel>Depth Range</FormLabel>
            <Input value={depthRange} onChange={(e) => setDepthRange(e.target.value)}/>
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Protected Area</FormLabel>
            <Checkbox isChecked={protectedArea} onChange={(e) => setProtectedArea(e.target.checked)}/>
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Active</FormLabel>
            <Switch isChecked={active} onChange={(e) => setActive(e.target.checked)}/>
          </FormControl>
          <HStack>
            <Button type="submit" colorScheme="teal" flex="1">
              {site ? "Update Site" : "Add Site"}
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
