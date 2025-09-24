'use client';

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {
  Box,
  Button,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import {getDives} from "@/services/dives";
import {getBoats} from "@/services/boats";
import {getSites} from "@/services/sites";
import {getUserProfile} from "@/services/users";
import {Boat, Dive, Site, Species} from "@/types/diveLogTypes";
import {UserProfile} from "@/types/userTypes";
import {formatDiveValue} from "@/utils/formatDiveValue";
import {useAuth} from "@/context/AuthContext";
import {getSpecies} from "@/services/species";

export default function ViewDivesPage() {
  const {user} = useAuth();
  const [dives, setDives] = useState<Dive[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [prefs, setPrefs] = useState<UserProfile["preferences"] | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedBoat, setSelectedBoat] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedGuide, setSelectedGuide] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");


  // modal state
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [selectedDive, setSelectedDive] = useState<Dive | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setPrefs(
          profile?.preferences || {
            units: {depth: "meters", temp: "celsius", pressure: "bar"},
          }
        );
      }
      const [divesData, boatsData, sitesData, speciesData] = await Promise.all([
        getDives(),
        getBoats(),
        getSites(),
        getSpecies(),
      ]);
      setDives(divesData);
      setBoats(boatsData);
      setSites(sitesData);
      setSpeciesList(speciesData);
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) return <Spinner/>;

  // filter
  const filteredDives = dives.filter(
    (d) =>
      (!selectedBoat || d.boatId === selectedBoat) &&
      (!selectedSite || d.diveSiteId === selectedSite) &&
      (!selectedGuide || d.diveGuide === selectedGuide) &&
      (!selectedSpecies || d.sightings?.some((s) => s.speciesId === selectedSpecies && s.count > 0))
  );

  const allGuides = Array.from(new Set(dives.map((d) => d.diveGuide))).sort();

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Logged Dives
      </Heading>

      {/* Filters */}
      <HStack mb={4} spacing={4}>
        <Select
          placeholder="Filter by Boat"
          value={selectedBoat}
          onChange={(e) => setSelectedBoat(e.target.value)}
        >
          {boats.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder="Filter by Site"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder="Filter by Guide"
          value={selectedGuide}
          onChange={(e) => setSelectedGuide(e.target.value)}
        >
          {allGuides.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Species"
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
        >
          {speciesList.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </Select>
      </HStack>
      {/* Table */}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Dive</Th>
            <Th>Guide</Th>
            <Th>Boat</Th>
            <Th>Site</Th>
            <Th>Depth</Th>
            <Th>Temp</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredDives.map((dive) => {
            const d = prefs
              ? formatDiveValue(dive, prefs, boats, sites)
              : (dive as any);
            return (
              <Tr key={dive.id}>
                <Td>
                  {(dive.date as Date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </Td>
                <Td>{dive.diveSlot.toUpperCase()}</Td>
                <Td>{dive.diveGuide}</Td>
                <Td>{d.boatName}</Td>
                <Td>{d.siteName}</Td>
                <Td>{d.depthDisplay}</Td>
                <Td>{d.tempDisplay}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      flex={'1'}
                      colorScheme="blue"
                      onClick={() => {
                        setSelectedDive(dive);
                        onOpen();
                      }}
                    >
                      Sightings
                    </Button>

                    <Button
                      size="sm"
                      flex={'1'}
                      colorScheme="teal"
                      onClick={() => router.push(`/dives/edit/${dive.id}`)}
                    >
                      Edit
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      {/* Modal for sightings */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader>Sightings</ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            {selectedDive?.sightings?.length ? (
              selectedDive.sightings.map((s) => {
                const sp = speciesList.find((sp) => sp.id === s.speciesId);
                const isHighlighted = selectedSpecies === sp?.id;
                return (
                  <Text
                    key={s.speciesId}
                    fontWeight={isHighlighted ? "bold" : "normal"}
                    color={isHighlighted ? "teal.500" : "inherit"}
                  >
                    {sp?.name || "Unknown"}: {s.count}
                  </Text>
                );
              })
            ) : (
              <Text>No sightings logged.</Text>
            )}
          </ModalBody>

        </ModalContent>
      </Modal>
    </Box>
  );
}
