'use client'

import {
  Box,
  Flex,
  VStack,
  Heading,
  Progress,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField
} from '@chakra-ui/react'
import { Species, Sighting } from '@/app/app/dive-log/_types'

interface StepSightingsProps {
  speciesList: Species[]
  sightings: Sighting[]
  step: number
  maxStep: number
  progressValue: number
  onChange: (speciesId: string, count: number) => void
}

export function StepSightings ({
  speciesList,
  sightings,
  step,
  maxStep,
  progressValue,
  onChange
}: StepSightingsProps) {
  const uniqueSteps = Array.from(
    new Set(speciesList.map(s => s.step || 1))
  ).sort()
  const currentStep = uniqueSteps[step - 1]
  const stepSpecies = speciesList.filter(sp => (sp.step || 1) === currentStep)

  return (
    <Flex
      direction='column'
      justify='space-between'
      minH={{ base: '75vh', md: 'auto' }}
      maxH={{ base: '85vh', md: 'none' }}
      p={{ base: 3, md: 4 }}
    >
      <Box flexShrink={0}>
        <Heading size='lg' mb={{ base: 2, md: 4 }}>
          Sightings – Step {currentStep}
        </Heading>
        <Progress value={progressValue} mb={4} colorScheme='teal' />
      </Box>
      <Box flex='1' overflowY='auto' pr={1} pb={4}>
        <VStack spacing={{ base: 2, md: 4 }} align='stretch'>
          {stepSpecies.map(sp => (
            <FormControl key={sp.id}>
              <FormLabel>{sp.name}</FormLabel>
              <NumberInput
                min={0}
                value={sightings.find(s => s.speciesId === sp.id)?.count || 0}
                onChange={(_, v) => onChange(sp.id, v)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          ))}
        </VStack>
      </Box>
    </Flex>
  )
}
