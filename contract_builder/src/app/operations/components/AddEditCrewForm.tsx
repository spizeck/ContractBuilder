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
  Select,
  Text,
} from '@chakra-ui/react'
import { CrewMember } from '@/types/crewTypes'

interface AddEditCrewFormProps {
  crew?: CrewMember
  onSave: (data: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function AddEditCrewForm({ crew, onSave, onCancel }: AddEditCrewFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<CrewMember['role']>('crew')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (crew) {
      setName(crew.name)
      setRole(crew.role)
      setEmail(crew.email || '')
      setPhone(crew.phone || '')
      setActive(crew.active)
    }
  }, [crew])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Please enter a crew member name')
      return
    }
    onSave({ name: name.trim(), role, email: email.trim() || undefined, phone: phone.trim() || undefined, active })
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter crew member full name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Role</FormLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value as CrewMember['role'])}>
              <option value="captain">Captain</option>
              <option value="dive_master">Dive Master</option>
              <option value="deckhand">Deckhand</option>
              <option value="crew">Crew Member</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="crew@example.com (optional)"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Phone</FormLabel>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890 (optional)"
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Active</FormLabel>
            <Switch isChecked={active} onChange={(e) => setActive(e.target.checked)} />
            <Text fontSize="sm" color="textMuted" ml={2}>
              Inactive crew members won't appear in dropdowns
            </Text>
          </FormControl>

          <HStack spacing={4}>
            <Button type="submit" colorScheme="teal" flex={1}>
              {crew ? 'Update Crew Member' : 'Add Crew Member'}
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
