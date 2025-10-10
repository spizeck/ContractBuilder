'use client'

import { HStack, Button } from '@chakra-ui/react'
import { Dive } from '@/types/diveLogTypes'
import { deleteDive } from '@/services/dives' // ✅ Import Firestore helper

// Props used in form context (multi-step form)

interface FormActionsProps {
  step: number
  maxStep: number
  initialDive?: boolean
  onCancel: () => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  mode?: 'form'
}

// Props used in view context (logged dives list)

interface ViewActionsProps {
  dive: Dive
  userId?: string
  role?: string
  setDives: React.Dispatch<React.SetStateAction<Dive[]>>
  setSelectedDive: React.Dispatch<React.SetStateAction<Dive | null>>
  onOpen: () => void
  mode?: 'view'
}

// Unified prop type – can be either form or view mode

export type DiveActionsProps = FormActionsProps | ViewActionsProps

export function DiveActions (props: DiveActionsProps) {
  // --- VIEW MODE ---
  if ('dive' in props) {
    const { dive, setDives, setSelectedDive, onOpen } = props

    async function handleDelete () {
      const confirmDelete = confirm(
        `Are you sure you want to delete the dive on ${new Date(
          dive.date
        ).toLocaleDateString()}?`
      )
      if (!confirmDelete) return

      try {
        await deleteDive(dive.id)
        setDives(prev => prev.filter(d => d.id !== dive.id))
      } catch (err) {
        console.error('Error deleting dive:', err)
        alert('Failed to delete dive. Please try again.')
      }
    }

    return (
      <HStack spacing={2} pt={2}>
        <Button
          size='sm'
          colorScheme='blue'
          onClick={() => alert('Edit dive TBD')}
        >
          Edit
        </Button>
        <Button
          size='sm'
          onClick={() => {
            setSelectedDive(dive)
            onOpen()
          }}
        >
          Sightings
        </Button>
        <Button size='sm' colorScheme='red' onClick={handleDelete}>
          Delete
        </Button>
      </HStack>
    )
  }

  // --- FORM MODE ---
  const { step, maxStep, initialDive, onCancel, onBack, onNext, onSubmit } =
    props

  if (step === 0) {
    return (
      <HStack spacing={2} pt={2}>
        <Button onClick={onCancel} flex='1'>
          Cancel
        </Button>
        <Button colorScheme='teal' flex='1' onClick={onNext}>
          Next
        </Button>
      </HStack>
    )
  }

  if (step > 0 && step <= maxStep) {
    return (
      <HStack spacing={2} pt={2}>
        <Button flex={1} onClick={onBack}>
          Back
        </Button>
        <Button flex={1} colorScheme='teal' onClick={onNext}>
          Next
        </Button>
      </HStack>
    )
  }

  return (
    <HStack mt={4} spacing={3}>
      <Button colorScheme='red' onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onBack}>Back</Button>
      <Button colorScheme='teal' onClick={onSubmit}>
        {initialDive ? 'Update Dive' : 'Save Dive'}
      </Button>
    </HStack>
  )
}
