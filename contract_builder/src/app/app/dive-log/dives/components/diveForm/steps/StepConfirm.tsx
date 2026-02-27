'use client'

import { Box, Heading, Progress, Text } from '@chakra-ui/react'
import { Boat, Site, Species, Sighting } from '@/types/diveLogTypes'

interface StepConfirmProps {
  date: string
  diveSlot: string
  diveGuide: string
  boatId: string
  diveSiteId: string
  displayDepth: number
  displayTemp: number
  prefs: any
  boats: Boat[]
  sites: Site[]
  sightings: Sighting[]
  speciesList: Species[]
  progressValue: number
}

export function StepConfirm ({
  date,
  diveSlot,
  diveGuide,
  boatId,
  diveSiteId,
  displayDepth,
  displayTemp,
  prefs,
  boats,
  sites,
  sightings,
  speciesList,
  progressValue
}: StepConfirmProps) {
  return (
    <Box p={{ base: 3, md: 6 }}>
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
    </Box>
  )
}
