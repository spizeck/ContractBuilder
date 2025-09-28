'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Progress,
  Select,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import {
  Boat,
  Dive,
  DiveSlot,
  Guide,
  Sighting,
  Site,
  Species
} from '@/types/diveLogTypes'
import { UserProfile } from '@/types/userTypes'
import { useAuth } from '@/context/AuthContext'
import { getBoats } from '@/services/boats'
import { getSites } from '@/services/sites'
import { getSpecies } from '@/services/species'
import { getUserProfile } from '@/services/users'
import { getGuides } from '@/services/guides'
import { checkDuplicateDive } from '@/services/dives'
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  feetToMeters,
  metersToFeet
} from '@/utils/conversions'
import { validateDive } from '@/utils/validators'

interface DiveFormProps {
  initialDive?: Dive
  onSave: (data: Omit<Dive, 'id' | 'createdAt'>) => Promise<void>
  onCancel: () => void
}

export default function DiveForm ({
  initialDive,
  onSave,
  onCancel
}: DiveFormProps) {
  const { user } = useAuth()

  const [prefs, setPrefs] = useState<UserProfile['preferences'] | undefined>(
    undefined
  )
  const [boats, setBoats] = useState<Boat[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState('')
  const [diveSlot, setDiveSlot] = useState<DiveSlot>('' as DiveSlot)
  const [boatId, setBoatId] = useState('')
  const [diveGuide, setDiveGuide] = useState('')
  const [diveSiteId, setDiveSiteId] = useState('')
  const [maxDepth, setMaxDepth] = useState(0) // meters
  const [waterTemperature, setWaterTemperature] = useState(0) // celsius
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [guides, setGuides] = useState<Guide[]>([])

  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)

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
      const [boatsData, sitesData, speciesData] = await Promise.all([
        getBoats(),
        getSites(),
        getSpecies()
      ])
      setBoats(boatsData.filter(b => b.active))
      const sortedSites = sitesData.sort((a, b) => a.name.localeCompare(b.name))
      setSites(sortedSites)
      const activeSpecies = speciesData.filter(sp => sp.active)

      setSpeciesList(
        activeSpecies.sort((a, b) => {
          const catA = (a.category || 'Uncategorized').toLowerCase()
          const catB = (b.category || 'Uncategorized').toLowerCase()
          if (catA !== catB) {
            return catA.localeCompare(catB)
          }
          return a.name.localeCompare(b.name)
        })
      )
      const uniqueSteps = Array.from(
        new Set(activeSpecies.map(s => Number(s.step) || 1))
      ).sort((a, b) => a - b)
      setMaxStep(uniqueSteps.length)
      setLoading(false)
    }

    load()
  }, [user])

  useEffect(() => {
    if (initialDive) {
      setDate(
        initialDive.date instanceof Date
          ? initialDive.date.toISOString().split('T')[0]
          : ''
      )
      setDiveSlot(initialDive.diveSlot)
      setBoatId(initialDive.boatId)
      setDiveGuide(initialDive.diveGuide)
      setDiveSiteId(initialDive.diveSiteId)
      setMaxDepth(initialDive.maxDepth)
      setWaterTemperature(initialDive.waterTemperature)
      setSightings(initialDive.sightings || [])
    } else {
      setDate(new Date().toISOString().split('T')[0])
      setDiveGuide(user?.displayName || '')
    }
  }, [initialDive, user])

  useEffect(() => {
    getGuides().then(setGuides)
  }, [])

  const handleSightingChange = (speciesId: string, count: number) => {
    setSightings(prev => {
      const updated = [...prev]
      const idx = updated.findIndex(s => s.speciesId === speciesId)
      if (idx >= 0) {
        updated[idx].count = count
      } else {
        updated.push({ speciesId, count })
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!user) return

    // 1. Run validators (soft warnings)
    const warnings = validateDive(maxDepth, waterTemperature, prefs)
    if (warnings.length) {
      const proceed = confirm(
        'Validation warnings:\n\n' +
          warnings.join('\n') +
          '\n\nDo you want to continue?'
      )
      if (!proceed) return
    }
    // 2. Hard stop for duplicate check
    const duplicate = await checkDuplicateDive(
      date, // YYYY-MM-DD string
      diveSlot, // "9am" | "11am" | ...
      boatId,
      initialDive?.id // ignore self if editing
    )

    if (duplicate) {
      alert('This boat already has a dive scheduled at that time.')
      return
    }
    // 3. Save dive

    await onSave({
      date,
      diveSlot,
      boatId,
      diveGuide,
      diveSiteId,
      maxDepth,
      waterTemperature,
      createdBy: user.uid,
      sightings
    })
  }

  if (loading) return <Spinner />

  const totalSteps = maxStep + 2
  const progressValue = ((step + 1) / totalSteps) * 100

  const depthLabel =
    prefs?.units.depth === 'feet' ? 'Max Depth (ft)' : 'Max Depth (m)'
  const tempLabel =
    prefs?.units.temp === 'fahrenheit' ? 'Water Temp (°F)' : 'Water Temp (°C)'

  const displayDepth =
    prefs?.units.depth === 'feet'
      ? Math.round(metersToFeet(maxDepth))
      : Math.round(maxDepth * 2) / 2

  const displayTemp =
    prefs?.units.temp === 'fahrenheit'
      ? Math.round(celsiusToFahrenheit(waterTemperature))
      : Math.round(waterTemperature * 2) / 2

  const handleDepthChange = (_: string, val: number) => {
    if (prefs?.units.depth === 'feet') {
      setMaxDepth(feetToMeters(val))
    } else {
      setMaxDepth(val)
    }
  }

  const handleTempChange = (_: string, val: number) => {
    if (prefs?.units.temp === 'fahrenheit') {
      setWaterTemperature(fahrenheitToCelsius(val))
    } else {
      setWaterTemperature(val)
    }
  }

  // --- Step 0: Dive Info ---
  if (step === 0) {
    return (
      <Box p={{ base: 3, md: 6}}>
          <Heading size="lg" mb={{ base: 2, md: 4 }}>
          {initialDive ? 'Edit Dive' : 'New Dive'}
        </Heading>
        <Progress value={progressValue} mb={4} colorScheme='teal' />

        <VStack spacing={{ base: 2, md: 4 }} align="stretch">
          {/* Date, Number, Boat, Guide, Site */}
          <FormControl isRequired>
            <FormLabel>Date</FormLabel>
            <Input
              type='date'
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Dive Time</FormLabel>
            <Select
              value={diveSlot}
              onChange={e => setDiveSlot(e.target.value as DiveSlot)}
            >
              <option value=''>Select time</option>
              <option value='9am'>9am Dive</option>
              <option value='11am'>11am Dive</option>
              <option value='1pm'>1pm Dive</option>
              <option value='4pm'>4pm Dive</option>
              <option value='night'>Night Dive</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Boat</FormLabel>
            <Select value={boatId} onChange={e => setBoatId(e.target.value)}>
              <option value=''>Select boat</option>
              {boats.map(b => (
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
              onChange={e => setDiveGuide(e.target.value)}
            >
              <option value=''>Select guide</option>
              {guides
                .filter(g => g.active)
                .map(g => (
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
              onChange={e => setDiveSiteId(e.target.value)}
            >
              <option value=''>Select site</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Depth + Temp */}
          <FormControl isRequired>
            <FormLabel>{depthLabel}</FormLabel>
            <NumberInput
              min={1}
              max={prefs?.units.depth === 'feet' ? 330 : 100}
              value={displayDepth}
              onChange={handleDepthChange}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{tempLabel}</FormLabel>
            <NumberInput
              min={prefs?.units.temp === 'fahrenheit' ? 40 : 5}
              max={prefs?.units.temp === 'fahrenheit' ? 110 : 40}
              value={displayTemp}
              onChange={handleTempChange}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <HStack spacing={2}>
            <Button onClick={onCancel} flex='1'>
              Cancel
            </Button>
            <Button colorScheme='teal' flex='1' onClick={() => setStep(1)}>
              Next
            </Button>
          </HStack>
        </VStack>
      </Box>
    )
  }

  // --- Steps 1..n: Sightings ---
  if (step > 0 && step <= maxStep) {
    const uniqueSteps = Array.from(
      new Set(speciesList.map(s => s.step || 1))
    ).sort()
    const currentStep = uniqueSteps[step - 1]
    const stepSpecies = speciesList.filter(sp => (sp.step || 1) === currentStep)

    return (
      <Box p={6}>
        <Heading size='lg' mb={4}>
          Sightings – Step {currentStep}
        </Heading>
        <Progress value={progressValue} mb={4} colorScheme='teal' />

        <VStack spacing={4} align='stretch'>
          {stepSpecies.map(sp => (
            <FormControl key={sp.id}>
              <FormLabel>{sp.name}</FormLabel>
              <NumberInput
                min={0}
                value={sightings.find(s => s.speciesId === sp.id)?.count || 0}
                onChange={(_, v) => handleSightingChange(sp.id, v)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          ))}

          <HStack spacing={2}>
            <Button flex={1} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button
              flex={1}
              colorScheme='teal'
              onClick={() => setStep(step + 1)}
            >
              Next
            </Button>
          </HStack>
        </VStack>
      </Box>
    )
  }

  // --- Final Step: Confirm ---
  if (step === maxStep + 1) {
    return (
      <Box p={6}>
        <Heading size='lg' mb={4}>
          Confirm Dive Entry
        </Heading>
        <Progress value={progressValue} mb={4} colorScheme='teal' />

        <Text>
          <b>Date:</b> {date}
        </Text>
        <Text>
          <b>Dive:</b> {diveSlot}
        </Text>
        <Text>
          <b>Guide:</b> {diveGuide}
        </Text>
        <Text>
          <b>Boat:</b> {boats.find(b => b.id === boatId)?.name}
        </Text>
        <Text>
          <b>Site:</b> {sites.find(s => s.id === diveSiteId)?.name}
        </Text>
        <Text>
          <b>Max Depth:</b> {displayDepth}{' '}
          {prefs?.units.depth === 'feet' ? 'ft' : 'm'}
        </Text>
        <Text>
          <b>Water Temp:</b> {displayTemp}{' '}
          {prefs?.units.temp === 'fahrenheit' ? '°F' : '°C'}
        </Text>

        <Heading size='md' mt={4}>
          Sightings
        </Heading>
        {sightings.map(s => {
          const sp = speciesList.find(sp => sp.id === s.speciesId)
          return (
            <Text key={s.speciesId}>
              {sp?.name}: {s.count}
            </Text>
          )
        })}

        <HStack mt={4} spacing={3}>
          <Button
            colorScheme='red'
            onClick={() => {
              if (
                confirm('All progress will be lost. Do you want to continue?')
              ) {
                onCancel()
              }
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => setStep(step - 1)}>Back</Button>
          <Button colorScheme='teal' onClick={handleSubmit}>
            {initialDive ? 'Update Dive' : 'Save Dive'}
          </Button>
        </HStack>
      </Box>
    )
  }

  return null
}
