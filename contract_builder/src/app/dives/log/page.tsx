'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Heading,
  NumberInput,
  NumberInputField,
  Spinner,
  Text,
  Progress
} from '@chakra-ui/react'
import { addDive } from '@/services/dives'
import { getBoats } from '@/services/boats'
import { getSites } from '@/services/sites'
import { getSpecies } from '@/services/species'
import { getUserProfile } from '@/services/users'
import {
  feetToMeters,
  metersToFeet,
  fahrenheitToCelsius,
  celsiusToFahrenheit,
  psiToBar,
  barToPsi
} from '@/utils/conversions'
import { Boat, Site, Species, Sighting } from '@/types/diveLogTypes'
import { useAuth } from '@/context/AuthContext'
import { UserProfile } from '@/types/userTypes'

export default function LogDivePage () {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [boats, setBoats] = useState<Boat[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)

  // Dive data state
  const [date, setDate] = useState('')
  const [diveNumber, setDiveNumber] = useState<number>(1)
  const [boatId, setBoatId] = useState('')
  const [diveGuide, setDiveGuide] = useState('')
  const [diveSiteId, setDiveSiteId] = useState('')
  const [maxDepth, setMaxDepth] = useState<number>(0)
  const [waterTemperature, setWaterTemperature] = useState<number>(0)
  const [sightings, setSightings] = useState<Sighting[]>([])

  // Wizard state
  const [step, setStep] = useState(0) // 0 = Dive info, 1+ = Sightings, last = confirm
  const [maxStep, setMaxStep] = useState(0)

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then(profile => {
      if (profile) {
        setUserProfile(profile)

        // Autofill guide + today
        setDiveGuide(profile.name || '')
        setDate(new Date().toISOString().split('T')[0]) // yyyy-mm-dd
      }
    })
  }, [user])

  useEffect(() => {
    async function loadData () {
      const [boatsData, sitesData, speciesData] = await Promise.all([
        getBoats(),
        getSites(),
        getSpecies()
      ])
      setBoats(boatsData.filter(b => b.active))
      setSites(sitesData.filter(s => s.active))
      const activeSpecies = speciesData.filter(sp => sp.active)
      setSpeciesList(activeSpecies)

      const uniqueSteps = Array.from(
        new Set(activeSpecies.map(s => s.step || 1))
      )
      setMaxStep(uniqueSteps.length)
      setLoading(false)
    }
    loadData()
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

    await addDive({
      date: new Date(date),
      diveNumber,
      boatId,
      diveGuide,
      diveSiteId,
      maxDepth,
      waterTemperature,
      createdBy: user.uid,
      sightings
    })

    alert('Dive logged successfully!')
  }

  if (loading) return <Spinner />

  // helper for progress bar
  const totalSteps = maxStep + 2 // Dive info + sightings groups + confirmation
  const progressValue = ((step + 1) / totalSteps) * 100

  // ---- Step 0: Dive Info ----
  if (step === 0) {
    return (
      <Box p={6}>
        <Heading size='lg' mb={4}>
          Dive Information
        </Heading>
        <Progress value={progressValue} mb={4} colorScheme='teal' />

        <VStack spacing={4} align='stretch'>
          <FormControl isRequired>
            <FormLabel>Date</FormLabel>
            <Input
              type='date'
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Dive Number</FormLabel>
            <NumberInput
              min={1}
              value={diveNumber}
              onChange={(_, val) => setDiveNumber(val)}
            >
              <NumberInputField />
            </NumberInput>
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
            <Input
              value={diveGuide}
              onChange={e => setDiveGuide(e.target.value)}
            />
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

          <FormControl isRequired>
            <FormLabel>
              Max Depth ({userProfile?.preferences.units.depth})
            </FormLabel>
            <NumberInput
              min={1}
              value={
                userProfile?.preferences.units.depth === 'feet'
                  ? metersToFeet(maxDepth)
                  : maxDepth
              }
              onChange={(_, val) =>
                setMaxDepth(
                  userProfile?.preferences.units.depth === 'feet'
                    ? feetToMeters(val)
                    : val
                )
              }
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>
              Water Temp (°
              {userProfile?.preferences.units.temp === 'fahrenheit' ? 'F' : 'C'}
              )
            </FormLabel>
            <NumberInput
              min={1}
              value={
                userProfile?.preferences.units.temp === 'fahrenheit'
                  ? celsiusToFahrenheit(waterTemperature)
                  : waterTemperature
              }
              onChange={(_, val) =>
                setWaterTemperature(
                  userProfile?.preferences.units.temp === 'fahrenheit'
                    ? fahrenheitToCelsius(val)
                    : val
                )
              }
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <HStack>
            <Button colorScheme='teal' flex='1' onClick={() => setStep(1)}>
              Next
            </Button>
          </HStack>
        </VStack>
      </Box>
    )
  }

  // ---- Steps 1..n: Sightings grouped by step ----
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
                onChange={(_, val) => handleSightingChange(sp.id, val)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          ))}

          <HStack>
            <Button onClick={() => setStep(step - 1)}>Back</Button>
            <Button colorScheme='teal' onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </HStack>
        </VStack>
      </Box>
    )
  }

  // ---- Final Step: Confirmation ----
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
          <b>Dive Number:</b> {diveNumber}
        </Text>
        <Text>
          <b>Boat:</b> {boats.find(b => b.id === boatId)?.name}
        </Text>
        <Text>
          <b>Dive Guide:</b> {diveGuide}
        </Text>
        <Text>
          <b>Site:</b> {sites.find(s => s.id === diveSiteId)?.name}
        </Text>
        <Text>
          <b>Max Depth:</b>{' '}
          {userProfile?.preferences.units.depth === 'feet'
            ? metersToFeet(maxDepth).toFixed(1)
            : maxDepth}{' '}
          {userProfile?.preferences.units.depth}
        </Text>

        <Text>
          <b>Water Temp:</b>{' '}
          {userProfile?.preferences.units.temp === 'fahrenheit'
            ? celsiusToFahrenheit(waterTemperature).toFixed(1)
            : waterTemperature}{' '}
          °{userProfile?.preferences.units.temp === 'fahrenheit' ? 'F' : 'C'}
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

        <HStack mt={4}>
          <Button onClick={() => setStep(step - 1)}>Back</Button>
          <Button colorScheme='teal' onClick={handleSubmit}>
            Submit
          </Button>
        </HStack>
      </Box>
    )
  }
}
