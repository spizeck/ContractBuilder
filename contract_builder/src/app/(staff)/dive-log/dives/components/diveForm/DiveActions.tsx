'use client'

import { Button, HStack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { deleteDive } from '@/services/dives'
import { Dive } from '@/types/diveLogTypes'

export interface DiveActionsProps {
  dive: Dive
  userId?: string
  role?: string
  setDives?: React.Dispatch<React.SetStateAction<Dive[]>>
  setSelectedDive?: (dive: Dive) => void
  onOpen?: () => void
}

export default function DiveActions ({
  dive,
  userId,
  role,
  setDives,
  setSelectedDive,
  onOpen
}: DiveActionsProps) {
  const router = useRouter()
  const canDelete =
    dive.createdBy === userId || ['manager', 'admin'].includes(role || '')

  async function handleDelete () {
    if (!confirm('Are you sure you want to delete this dive log?')) return
    try {
      await deleteDive(dive.id)
      setDives?.(prev => prev.filter(d => d.id !== dive.id))
    } catch (err) {
      console.error('Error deleting dive:', err)
      alert('Failed to delete dive. Please try again.')
    }
  }

  return (
    <HStack spacing={canDelete ? 3 : 2} pt={2}>
      {canDelete && (
        <Button size='sm' colorScheme='red' onClick={handleDelete}>
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
          setSelectedDive?.(dive)
          onOpen?.()
        }}
      >
        Sightings
      </Button>
    </HStack>
  )
}
