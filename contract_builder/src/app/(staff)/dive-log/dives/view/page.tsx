'use client'

import { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  StackDivider,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useDisclosure,
  VStack
} from '@chakra-ui/react'
import { getDivesPage } from '@/app/(staff)/dive-log/_lib/divesRepo'
import { getBoats } from '@/app/(staff)/dive-log/_lib/boatsRepo'
import { getSites } from '@/app/(staff)/dive-log/_lib/sitesRepo'
import { getGuides } from '@/app/(staff)/dive-log/_lib/guidesRepo'
import { getUserProfile } from '@/app/(staff)/admin/_lib/usersRepo'
import { Boat, Dive, Guide, Site, Species } from '@/app/(staff)/dive-log/_types'
import { UserProfile } from '@core/types/userTypes'
import { formatDiveValue } from '@/app/(staff)/dive-log/_lib/formatDiveValue'
import { useAuth } from '@core/auth/AuthContext'
import { getSpecies } from '@/app/(staff)/dive-log/_lib/speciesRepo'
import DiveActions from '../components/diveForm/DiveActions'
import { formatDiveDate } from '@shared/utils/dateUtils'

export default function ViewDivesPage () {
  const { user, role } = useAuth()
  const [dives, setDives] = useState<Dive[]>([])
  const [boats, setBoats] = useState<Boat[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [prefs, setPrefs] = useState<UserProfile['preferences'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [selectedBoat, setSelectedBoat] = useState('')
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedGuide, setSelectedGuide] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDive, setSelectedDive] = useState<Dive | null>(null)

  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    const load = async () => {
      if (user) {
        const profile = await getUserProfile(user.uid)
        setPrefs(
          profile?.preferences || {
            units: { depth: 'meters', temp: 'celsius', pressure: 'bar' }
          }
        )
      }
      const [
        { dives: divesData, lastDoc: newLastDoc },
        boatsData,
        sitesData,
        speciesData,
        guidesData
      ] = await Promise.all([
        getDivesPage(25),
        getBoats(),
        getSites(),
        getSpecies(),
        getGuides(true)
      ])
      setDives(divesData)
      setLastDoc(newLastDoc)
      setBoats(boatsData)
      setSites(sitesData)
      setSpeciesList(speciesData)
      setGuides(guidesData)
      setLoading(false)
    }

    load()
  }, [user])

  async function loadMore () {
    if (!lastDoc) return
    setLoadingMore(true)
    const { dives: newDives, lastDoc: newLastDoc } = await getDivesPage(
      25,
      lastDoc
    )
    setDives(prev => [...prev, ...newDives])
    setLastDoc(newLastDoc)
    setLoadingMore(false)
  }

  if (loading) return <Spinner />

  const filteredDives = dives.filter(
    d =>
      (!selectedBoat || d.boatId === selectedBoat) &&
      (!selectedSite || d.diveSiteId === selectedSite) &&
      (!selectedGuide || d.diveGuide === selectedGuide) &&
      (!selectedSpecies ||
        d.sightings?.some(s => s.speciesId === selectedSpecies && s.count > 0))
  )

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
          {guides.map(g => (
            <option key={g.id} value={g.name}>
              {g.name}
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
        <>
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
                    <Td>{formatDiveDate(dive.date)}</Td>

                    <Td>{dive.diveSlot.toUpperCase()}</Td>
                    <Td>{dive.diveGuide}</Td>
                    <Td>{d.boatName}</Td>
                    <Td>
                      {d.siteName}
                      {dive.isDrift && (
                        <Badge ml={2} colorScheme='blue' fontSize='xs'>
                          Drift
                        </Badge>
                      )}
                    </Td>
                    <Td>{d.depthDisplay}</Td>
                    <Td>{d.tempDisplay}</Td>
                    <Td>
                      <DiveActions
                        dive={dive}
                        userId={user?.uid}
                        role={role}
                        setDives={setDives}
                        setSelectedDive={setSelectedDive}
                        onOpen={onOpen}
                      />
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
          {lastDoc && (
            <Box textAlign='left' mt={4}>
              <Button onClick={loadMore} isLoading={loadingMore}>
                Load More
              </Button>
            </Box>
          )}
        </>
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
                    {formatDiveDate(dive.date)} - {dive.diveSlot.toUpperCase()}
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
                      {dive.isDrift && (
                        <Badge ml={2} colorScheme='blue' fontSize='xs'>
                          Drift
                        </Badge>
                      )}
                    </Text>
                    <Text>
                      <b>Depth:</b> {d.depthDisplay}
                    </Text>
                    <Text>
                      <b>Temp:</b> {d.tempDisplay}
                    </Text>
                    <DiveActions
                      dive={dive}
                      userId={user?.uid}
                      role={role}
                      setDives={setDives}
                      setSelectedDive={setSelectedDive}
                      onOpen={onOpen}
                    />
                  </Stack>
                </CardBody>
              </Card>
            )
          })}
          {lastDoc && (
            <Box textAlign='center' mt={4}>
              <Button onClick={loadMore} isLoading={loadingMore}>
                Load More
              </Button>
            </Box>
          )}
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
