'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Switch,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberIncrementStepper,
  Text,
} from '@chakra-ui/react'
import { Taxi } from '@/types/taxiTypes'

interface AddEditTaxiFormProps {
  taxi?: Taxi
  onSave: (data: Omit<Taxi, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function AddEditTaxiForm({ taxi, onSave, onCancel }: AddEditTaxiFormProps) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(4)
  const [priority, setPriority] = useState(100)
  const [driverName, setDriverName] = useState('')
  const [driverContact, setDriverContact] = useState('')
  const [active, setActive] = useState(true)

  const normalizePhone = (input: string) => {
    let s = input.trim()
    if (!s) return ''
    if (s.startsWith('00')) s = `+${s.slice(2)}`
    const hasPlus = s.startsWith('+')
    const digitsOnly = s.replace(/\D/g, '')
    return hasPlus ? `+${digitsOnly}` : digitsOnly
  }

  useEffect(() => {
    if (taxi) {
      setName(taxi.name)
      setCapacity(taxi.capacity)
      setPriority(taxi.priority ?? 100)
      setDriverName(taxi.driverName || '')
      setDriverContact(taxi.driverContact || '')
      setActive(taxi.active)
    }
  }, [taxi])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Please enter a taxi name')
      return
    }
    if (capacity < 1 || capacity > 20) {
      alert('Capacity must be between 1 and 20 passengers')
      return
    }
    onSave({ 
      name: name.trim(), 
      capacity, 
      priority,
      driverName: driverName.trim() || undefined, 
      driverContact: driverContact.trim() || undefined, 
      active 
    })
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Taxi Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter taxi name (e.g., Taxi 1, Sea Saba Shuttle)"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Auto-Schedule Priority</FormLabel>
            <NumberInput
              value={priority}
              onChange={(value) => setPriority(parseInt(value) || 100)}
              min={1}
              max={999}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="sm" color="textMuted" mt={1}>
              Lower numbers are preferred during auto-scheduling (e.g. 1 is highest priority)
            </Text>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Passenger Capacity</FormLabel>
            <NumberInput 
              value={capacity} 
              onChange={(value) => setCapacity(parseInt(value) || 1)}
              min={1}
              max={20}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="sm" color="textMuted" mt={1}>
              Maximum number of passengers this taxi can carry
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel>Driver Name</FormLabel>
            <Input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Enter driver name (optional)"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Driver Contact</FormLabel>
            <Input
              type="tel"
              value={driverContact}
              onChange={(e) => setDriverContact(e.target.value)}
              onBlur={() => setDriverContact((p) => normalizePhone(p))}
              placeholder="Phone number or contact info (optional)"
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Active</FormLabel>
            <Switch isChecked={active} onChange={(e) => setActive(e.target.checked)} />
            <Text fontSize="sm" color="textMuted" ml={2}>
              Inactive taxis won't appear in manifest assignments
            </Text>
          </FormControl>

          <HStack spacing={4}>
            <Button type="submit" colorScheme="teal" flex={1}>
              {taxi ? 'Update Taxi' : 'Add Taxi'}
            </Button>
            <Button onClick={onCancel} colorScheme="gray" flex={1}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  )
}
