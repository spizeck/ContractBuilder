'use client'

import { Button, HStack } from '@chakra-ui/react'

interface FormActionsProps {
  step: number
  maxStep: number
  initialDive?: boolean
  onCancel: () => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void | Promise<void>
  isSaving?: boolean
}

export default function FormActions ({
  step,
  maxStep,
  initialDive,
  onCancel,
  onBack,
  onNext,
  onSubmit,
  isSaving = false
}: FormActionsProps) {
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
      <Button colorScheme='teal' onClick={onSubmit} isLoading={isSaving} isDisabled={isSaving}>
        {initialDive ? 'Update Dive' : 'Save Dive'}
      </Button>
    </HStack>
  )
}
