'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  VStack,
  useBreakpointValue,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider
} from '@chakra-ui/react'
import { getDives, deleteDive } from '@/services/dives'
import { getBoats } from '@/services/boats'
import { getSites } from '@/services/sites'
import { getUserProfile } from '@/services/users'
import { Boat, Dive, Site, Species } from '@/types/diveLogTypes'
import { UserProfile } from '@/types/userTypes'
import { formatDiveValue } from '@/utils/formatDiveValue'
import { useAuth } from '@/context/AuthContext'
import { getSpecies } from '@/services/species'

export default function ViewDivesPage () {
  const { user, role } = useAuth()
  const [dives, setDives] = useState<Dive[]>([])
  const [boats, setBoats] = useState<Boat[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [prefs, setPrefs] = useState<UserProfile['preferences'] | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedBoat, setSelectedBoat] = useState('')
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedGuide, setSelectedGuide] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDive, setSelectedDive] = useState<Dive | null>(null)

  const router = useRouter()
  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    async function load () {
      if (user) {
        const profile = await getUserProfile(user.uid)
        setPrefs(
          profile?.preferences || {
            units: { depth: 'meters', temp: 'celsius', pressure: 'bar' }
          }
        )
      }
      const [divesData, boatsData, sitesData, speciesData] = await Promise.all([
        getDives(),
        getBoats(),
        getSites(),
        getSpecies()
      ])
      setDives(divesData)
      setBoats(boatsData)
      setSites(sitesData)
      setSpeciesList(speciesData)
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) return <Spinner />

  const filteredDives = dives.filter(
    d =>
      (!selectedBoat || d.boatId === selectedBoat) &&
      (!selectedSite || d.diveSiteId === selectedSite) &&
      (!selectedGuide || d.diveGuide === selectedGuide) &&
      (!selectedSpecies ||
        d.sightings?.some(s => s.speciesId === selectedSpecies && s.count > 0))
  )

  const allGuides = Array.from(new Set(dives.map(d => d.diveGuide))).sort()

  return (
    <Box p={6}>
      <Heading size='lg' mb={4}>
        Logged Dives
      </Heading>

      {/* Filters */}
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        mb={6}
        w='100%'
      >
        <Select
          placeholder='Filter by Boat'
          value={selectedBoat}
          onChange={e => setSelectedBoat(e.target.value)}
        >
          {boats.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder='Filter by Site'
          value={selectedSite}
          onChange={e => setSelectedSite(e.target.value)}
        >
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          placeholder='Filter by Guide'
          value={selectedGuide}
          onChange={e => setSelectedGuide(e.target.value)}
        >
          {allGuides.map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>

        <Select
          placeholder='Filter by Species'
          value={selectedSpecies}
          onChange={e => setSelectedSpecies(e.target.value)}
        >
          {speciesList.map(sp => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </Select>
      </Stack>

      {/* Desktop: Table view */}
      {!isMobile ? (
        <Table variant='simple'>
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
            {filteredDives.map(dive => {
              const d = prefs
                ? formatDiveValue(dive, prefs, boats, sites)
                : (dive as any)
              return (
                <Tr key={dive.id}>
                  <Td>
                    {(dive.date as Date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC'
                    })}
                  </Td>
                  <Td>{dive.diveSlot.toUpperCase()}</Td>
                  <Td>{dive.diveGuide}</Td>
                  <Td>{d.boatName}</Td>
                  <Td>{d.siteName}</Td>
                  <Td>{d.depthDisplay}</Td>
                  <Td>{d.tempDisplay}</Td>
                  <Td>
                    <HStack
                      spacing={
                        dive.createdBy === user?.uid ||
                        ['manager', 'admin'].includes(role)
                          ? 3
                          : 2
                      }
                      pt={2}
                    >
                      {(dive.createdBy === user?.uid ||
                        ['manager', 'admin'].includes(role)) && (
                        <Button
                          size='sm'
                          colorScheme='red'
                          onClick={async () => {
                            if (
                              confirm(
                                'Are you sure you want to delete this dive log?'
                              )
                            ) {
                              await deleteDive(dive.id)
                              setDives(prev =>
                                prev.filter(d => d.id !== dive.id)
                              )
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      <Button
                        size='sm'
                        flex={1}
                        colorScheme='teal'
                        onClick={() => router.push(`/dives/edit/${dive.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        flex={1}
                        colorScheme='blue'
                        onClick={() => {
                          setSelectedDive(dive)
                          onOpen()
                        }}
                      >
                        Sightings
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      ) : (
        /* Mobile: Card view */
        <VStack spacing={4} align='stretch'>
          {filteredDives.map(dive => {
            const d = prefs
              ? formatDiveValue(dive, prefs, boats, sites)
              : (dive as any)
            return (
              <Card
                key={dive.id}
                borderColor={'gray.200'}
                borderWidth='1px'
                borderRadius='lg'
              >
                <CardHeader pb={2}>
                  <Heading size='sm'>
                    {(dive.date as Date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC'
                    })}{' '}
                    - {dive.diveSlot.toUpperCase()}
                  </Heading>
                </CardHeader>
                <CardBody pt={2}>
                  <Stack divider={<StackDivider />} spacing={2}>
                    <Text>
                      <b>Guide:</b> {dive.diveGuide}
                    </Text>
                    <Text>
                      <b>Boat:</b> {d.boatName}
                    </Text>
                    <Text>
                      <b>Site:</b> {d.siteName}
                    </Text>
                    <Text>
                      <b>Depth:</b> {d.depthDisplay}
                    </Text>
                    <Text>
                      <b>Temp:</b> {d.tempDisplay}
                    </Text>
                    <HStack
                      spacing={
                        dive.createdBy === user?.uid ||
                        ['manager', 'admin'].includes(role)
                          ? 3
                          : 2
                      }
                      pt={2}
                    >
                      {(dive.createdBy === user?.uid ||
                        ['manager', 'admin'].includes(role)) && (
                        <Button
                          size='sm'
                          flex='1'
                          colorScheme='red'
                          onClick={async () => {
                            if (
                              confirm(
                                'Are you sure you want to delete this dive log?'
                              )
                            ) {
                              await deleteDive(dive.id)
                              setDives(prev =>
                                prev.filter(d => d.id !== dive.id)
                              )
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      <Button
                        size='sm'
                        colorScheme='teal'
                        onClick={() => router.push(`/dives/edit/${dive.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        colorScheme='blue'
                        onClick={() => {
                          setSelectedDive(dive)
                          onOpen()
                        }}
                      >
                        Sightings
                      </Button>
                    </HStack>
                  </Stack>
                </CardBody>
              </Card>
            )
          })}
        </VStack>
      )}

      {/* Modal for sightings */}
      <Modal isOpen={isOpen} onClose={onClose} size='md'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sightings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDive?.sightings?.length ? (
              selectedDive.sightings.map(s => {
                const sp = speciesList.find(sp => sp.id === s.speciesId)
                const isHighlighted = selectedSpecies === sp?.id
                return (
                  <Text
                    key={s.speciesId}
                    fontWeight={isHighlighted ? 'bold' : 'normal'}
                    color={isHighlighted ? 'teal.500' : 'inherit'}
                  >
                    {sp?.name || 'Unknown'}: {s.count}
                  </Text>
                )
              })
            ) : (
              <Text>No sightings logged.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
