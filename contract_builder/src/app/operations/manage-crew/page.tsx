'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  TableContainer,
  VStack,
  useToast,
  Badge,
  Text,
  IconButton
} from '@chakra-ui/react'
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'
import { CrewMember } from '@/types/crewTypes'
import { crewService } from '@/services/crew'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'
import AddEditCrewForm from '../components/AddEditCrewForm'

export default function ManageCrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchCrew()
  }, [])

  async function fetchCrew() {
    setLoading(true)
    try {
      const data = await crewService.getAllCrew()
      setCrew(data.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      toast({
        title: 'Error loading crew',
        description: 'Failed to fetch crew members',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      if (editingCrew) {
        await crewService.updateCrew(editingCrew.id, data)
        toast({
          title: 'Crew member updated',
          description: `${data.name} has been updated successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        await crewService.addCrew(data)
        toast({
          title: 'Crew member added',
          description: `${data.name} has been added successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
      setShowForm(false)
      setEditingCrew(null)
      await fetchCrew()
    } catch (error) {
      toast({
        title: 'Error saving crew member',
        description: 'Failed to save crew member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function handleDelete(crewMember: CrewMember) {
    if (!confirm(`Are you sure you want to remove ${crewMember.name}?`)) {
      return
    }

    try {
      await crewService.deleteCrew(crewMember.id)
      toast({
        title: 'Crew member removed',
        description: `${crewMember.name} has been removed`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      await fetchCrew()
    } catch (error) {
      toast({
        title: 'Error removing crew member',
        description: 'Failed to remove crew member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  function handleEdit(crewMember: CrewMember) {
    setEditingCrew(crewMember)
    setShowForm(true)
  }

  function handleAddNew() {
    setEditingCrew(null)
    setShowForm(true)
  }

  function getRoleColor(role: CrewMember['role']) {
    switch (role) {
      case 'captain': return 'red'
      case 'dive_master': return 'blue'
      case 'deckhand': return 'green'
      case 'crew': return 'gray'
      default: return 'gray'
    }
  }

  function getRoleLabel(role: CrewMember['role']) {
    switch (role) {
      case 'captain': return 'Captain'
      case 'dive_master': return 'Dive Master'
      case 'deckhand': return 'Deckhand'
      case 'crew': return 'Crew'
      default: return role
    }
  }

  if (showForm) {
    return (
      <ProtectedPage allowedRoles={["admin", "manager"]}>
        <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
          <Heading>Crew Management</Heading>
          <AddEditCrewForm
            crew={editingCrew || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingCrew(null)
            }}
          />
        </VStack>
      </ProtectedPage>
    )
  }

  return (
    <ProtectedPage allowedRoles={["admin", "manager"]}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Crew Management</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNew}>
            Add Crew Member
          </Button>
        </HStack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <Spinner size="xl" />
          </Box>
        ) : crew.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="textMuted">No crew members found</Text>
            <Button mt={4} leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNew}>
              Add First Crew Member
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {crew.map((crewMember) => (
                  <Tr key={crewMember.id}>
                    <Td fontWeight="bold">{crewMember.name}</Td>
                    <Td>
                      <Badge colorScheme={getRoleColor(crewMember.role)}>
                        {getRoleLabel(crewMember.role)}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        {crewMember.email && (
                          <Text fontSize="sm">{crewMember.email}</Text>
                        )}
                        {crewMember.phone && (
                          <Text fontSize="sm" color="textMuted">{crewMember.phone}</Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={crewMember.active ? 'green' : 'red'}>
                        {crewMember.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit crew member"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(crewMember)}
                        />
                        <IconButton
                          aria-label="Remove crew member"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(crewMember)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>
    </ProtectedPage>
  )
}
