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
  TableContainer
} from '@chakra-ui/react'
import { Boat } from '@/app/(staff)/dive-log/_types'
import ProtectedRoute from "@shared/components/LayoutComponents/ProtectedRoute";
import { addBoat, deleteBoat, getBoats, updateBoat } from '@/app/(staff)/dive-log/_lib/boatsRepo'
import AddEditBoatForm from '../components/AddEditBoatForm'

export default function BoatsPage () {
  const [boats, setBoats] = useState<Boat[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchBoats()
  }, [])

  async function fetchBoats () {
    setLoading(true)
    const data = await getBoats()
    setBoats(data.sort((a, b) => a.name.localeCompare(b.name)))
    setLoading(false)
  }

  async function handleSave (data: Omit<Boat, 'id' | 'createdAt'>) {
    if (editingBoat) {
      await updateBoat(editingBoat.id, data)
    } else {
      await addBoat(data)
    }
    setShowForm(false)
    setEditingBoat(null)
    await fetchBoats()
  }

  async function handleDelete (id: string) {
    if (confirm('Are you sure you want to delete this?')) {
      await deleteBoat(id)
      await fetchBoats()
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBoat(null)
  }

  return (
    <ProtectedRoute module="diveLog" permission="edit">
      <Box p={6}>
        <Heading size='lg' mb={4}>
          Manage Boats
        </Heading>

        {loading ? (
          <Spinner />
        ) : showForm ? (
          <AddEditBoatForm
            boat={editingBoat || undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <Button colorScheme='teal' mb={4} onClick={() => setShowForm(true)}>
              Add Boat
            </Button>
            <TableContainer>
              <Table variant='simple'>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Active</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {boats.map(boat => (
                    <Tr key={boat.id}>
                      <Td>{boat.name}</Td>
                      <Td>{boat.active ? 'Yes' : 'No'}</Td>
                      <Td>
                        <HStack>
                          <Button
                            size='sm'
                            onClick={() => {
                              setEditingBoat(boat)
                              setShowForm(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            colorScheme='red'
                            onClick={() => handleDelete(boat.id)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </ProtectedRoute>
  )
}
