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
  Badge,
  Text,
  IconButton,
  VStack
} from '@chakra-ui/react'
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi'
import { Boat } from '@/types/diveLogTypes'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'
import { addBoat, deleteBoat, getBoats, updateBoat } from '@/services/boats'
import AddEditBoatForm from '../components/AddEditBoatForm'

export default function ManageBoatsPage() {
  const [boats, setBoats] = useState<Boat[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchBoats()
  }, [])

  async function fetchBoats() {
    setLoading(true)
    try {
      const data = await getBoats()
      setBoats(data.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error fetching boats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data: Omit<Boat, 'id' | 'createdAt'>) {
    try {
      if (editingBoat) {
        await updateBoat(editingBoat.id, data)
      } else {
        await addBoat(data)
      }
      setShowForm(false)
      setEditingBoat(null)
      await fetchBoats()
    } catch (error) {
      console.error('Error saving boat:', error)
    }
  }

  async function handleDelete(boat: Boat) {
    if (!confirm(`Are you sure you want to delete ${boat.name}?`)) {
      return
    }
    try {
      await deleteBoat(boat.id)
      await fetchBoats()
    } catch (error) {
      console.error('Error deleting boat:', error)
    }
  }

  function handleEdit(boat: Boat) {
    setEditingBoat(boat)
    setShowForm(true)
  }

  function handleAddNew() {
    setEditingBoat(null)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <ProtectedPage allowedRoles={["admin", "hotel-manager"]}>
        <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
          <Heading>Boat Management</Heading>
          <AddEditBoatForm
            boat={editingBoat || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingBoat(null)
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
          <Heading>Boat Management</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNew}>
            Add Boat
          </Button>
        </HStack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <Spinner size="xl" />
          </Box>
        ) : boats.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="textMuted">No boats found</Text>
            <Button mt={4} leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNew}>
              Add First Boat
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Capacity</Th>
                  <Th>Dive Slots</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {boats.map((boat) => (
                  <Tr key={boat.id}>
                    <Td fontWeight="bold">{boat.name}</Td>
                    <Td>
                      <Badge colorScheme="blue">{boat.capacity || 'N/A'} divers</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="green">{boat.maxDiveSlots || 4} slots</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={boat.active ? 'green' : 'red'}>
                        {boat.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit boat"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(boat)}
                        />
                        <IconButton
                          aria-label="Delete boat"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(boat)}
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
