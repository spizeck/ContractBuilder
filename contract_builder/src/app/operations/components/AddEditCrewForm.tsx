'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Switch,
  VStack,
  Text,
} from '@chakra-ui/react'
import { CrewMember, CrewRole } from '@/types/crewTypes'

interface AddEditCrewFormProps {
  crew?: CrewMember
  onSave: (data: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function AddEditCrewForm({ crew, onSave, onCancel }: AddEditCrewFormProps) {
  const [name, setName] = useState('')
  const [roles, setRoles] = useState<CrewRole[]>([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)
  const [showRolesError, setShowRolesError] = useState(false)

  const normalizePhone = (input: string) => {
    let s = input.trim()
    if (!s) return ''
    if (s.startsWith('00')) s = `+${s.slice(2)}`
    const hasPlus = s.startsWith('+')
    const digitsOnly = s.replace(/\D/g, '')
    return hasPlus ? `+${digitsOnly}` : digitsOnly
  }

  const toggleRole = (role: CrewRole, checked: boolean) => {
    setRoles((prev) => {
      const next: CrewRole[] = checked
        ? (prev.includes(role) ? prev : [...prev, role])
        : prev.filter((r) => r !== role)

      if (next.length > 0) setShowRolesError(false)
      return next
    })
  }

  useEffect(() => {
    if (crew) {
      setName(crew.name)
      setRoles(crew.roles)
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
    if (!roles.length) {
      setShowRolesError(true)
      return
    }
    onSave({ name: name.trim(), roles, email: email.trim() || undefined, phone: phone.trim() || undefined, active })
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <form onSubmit={handleSubmit} noValidate>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter crew member full name"
            />
          </FormControl>

          <FormControl isRequired isInvalid={showRolesError && roles.length === 0}>
            <FormLabel>Roles</FormLabel>
            <VStack align="start" spacing={2} pt={1}>
              <Checkbox
                isChecked={roles.includes('captain')}
                onChange={(e) => toggleRole('captain', e.target.checked)}
              >
                Captain
              </Checkbox>
              <Checkbox
                isChecked={roles.includes('instructor')}
                onChange={(e) => toggleRole('instructor', e.target.checked)}
              >
                Instructor
              </Checkbox>
              <Checkbox
                isChecked={roles.includes('dive_guide')}
                onChange={(e) => toggleRole('dive_guide', e.target.checked)}
              >
                Dive Guide
              </Checkbox>
              <Checkbox
                isChecked={roles.includes('surface_support')}
                onChange={(e) => toggleRole('surface_support', e.target.checked)}
              >
                Surface Support
              </Checkbox>
            </VStack>
            <FormErrorMessage>Please select at least one role</FormErrorMessage>
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
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhone((p) => normalizePhone(p))}
              placeholder="+5994165328 (optional)"
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
