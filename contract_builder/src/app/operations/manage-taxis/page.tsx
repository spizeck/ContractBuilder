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
import { Taxi } from '@/types/taxiTypes'
import { taxiService } from '@/services/taxis'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'
import AddEditTaxiForm from '../components/AddEditTaxiForm'

export default function ManageTaxisPage() {
  const [taxis, setTaxis] = useState<Taxi[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTaxi, setEditingTaxi] = useState<Taxi | null>(null)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchTaxis()
  }, [])

  async function fetchTaxis() {
    setLoading(true)
    try {
      const data = await taxiService.getAllTaxis()
      setTaxis(data.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      toast({
        title: 'Error loading taxis',
        description: 'Failed to fetch taxis',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data: Omit<Taxi, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      if (editingTaxi) {
        await taxiService.updateTaxi(editingTaxi.id, data)
        toast({
          title: 'Taxi updated',
          description: `${data.name} has been updated successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        await taxiService.addTaxi(data)
        toast({
          title: 'Taxi added',
          description: `${data.name} has been added successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
      setShowForm(false)
      setEditingTaxi(null)
      await fetchTaxis()
    } catch (error) {
      toast({
        title: 'Error saving taxi',
        description: 'Failed to save taxi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function handleDelete(taxi: Taxi) {
    if (!confirm(`Are you sure you want to remove ${taxi.name}?`)) {
      return
    }

    try {
      await taxiService.deleteTaxi(taxi.id)
      toast({
        title: 'Taxi removed',
        description: `${taxi.name} has been removed`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      await fetchTaxis()
    } catch (error) {
      toast({
        title: 'Error removing taxi',
        description: 'Failed to remove taxi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  function handleEdit(taxi: Taxi) {
    setEditingTaxi(taxi)
    setShowForm(true)
  }

  function handleAddNew() {
    setEditingTaxi(null)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <ProtectedPage allowedRoles={["admin", "hotel-manager"]}>
        <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
          <Heading>Taxi Management</Heading>
          <AddEditTaxiForm
            taxi={editingTaxi || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingTaxi(null)
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
          <Heading>Taxi Management</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNew}>
            Add Taxi
          </Button>
        </HStack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <Spinner size="xl" />
          </Box>
        ) : taxis.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="textMuted">No taxis found</Text>
            <Button mt={4} leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNew}>
              Add First Taxi
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Capacity</Th>
                  <Th>Priority</Th>
                  <Th>Driver</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {taxis.map((taxi) => (
                  <Tr key={taxi.id}>
                    <Td fontWeight="bold">{taxi.name}</Td>
                    <Td>
                      <Badge colorScheme="blue">{taxi.capacity} passengers</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple">{taxi.priority ?? 100}</Badge>
                    </Td>
                    <Td>{taxi.driverName || 'Not assigned'}</Td>
                    <Td>
                      {taxi.driverContact ? (
                        <Text fontSize="sm">{taxi.driverContact}</Text>
                      ) : (
                        <Text fontSize="sm" color="textMuted">No contact</Text>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={taxi.active ? 'green' : 'red'}>
                        {taxi.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit taxi"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(taxi)}
                        />
                        <IconButton
                          aria-label="Remove taxi"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(taxi)}
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
