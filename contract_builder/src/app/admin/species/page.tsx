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
import { Species } from '@/types/diveLogTypes'
import {
  addSpecies,
  deleteSpecies,
  getSpecies,
  updateSpecies
} from '@/services/species'
import AddEditSpeciesForm from './AddEditSpeciesForm'
import ProtectedPage from '@/components/ProtectedPage'

export default function SpeciesPage () {
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchSpecies()
  }, [])

  async function fetchSpecies () {
    setLoading(true)
    const data = await getSpecies()
    setSpeciesList(data.sort((a, b) => a.name.localeCompare(b.name)))
    setLoading(false)
  }

  async function handleSave (data: Omit<Species, 'id'>) {
    if (editingSpecies) {
      await updateSpecies(editingSpecies.id, data)
    } else {
      await addSpecies(data)
    }
    setShowForm(false)
    setEditingSpecies(null)
    fetchSpecies()
  }

  async function handleDelete (id: string) {
    if (confirm('Are you sure you want to delete this?')) {
      await deleteSpecies(id)
      fetchSpecies()
    }
  }

  return (
    <ProtectedPage allowedRoles={['admin', 'manager']}>
      <Box p={6}>
        <Heading size='lg' mb={4}>
          Manage Species
        </Heading>

        {loading ? (
          <Spinner />
        ) : showForm ? (
          <AddEditSpeciesForm
            species={editingSpecies || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingSpecies(null)
            }}
          />
        ) : (
          <>
            <Button colorScheme='teal' mb={4} onClick={() => setShowForm(true)}>
              Add Species
            </Button>
            <TableContainer>
              <Table variant='simple'>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Step</Th>
                    <Th>Active</Th>
                    <Th>Category</Th>
                    <Th>Scientific Name</Th>
                    <Th>Icon</Th>
                    <Th>IUCN Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {speciesList.map(species => (
                    <Tr key={species.id}>
                      <Td>{species.name}</Td>
                      <Td>{species.step}</Td>
                      <Td>{species.active ? 'Yes' : 'No'}</Td>
                      <Td>{species.category}</Td>
                      <Td>{species.scientificName}</Td>
                      <Td>{species.icon}</Td>
                      <Td>{species.iucnStatus}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size='sm'
                            onClick={() => {
                              setEditingSpecies(species)
                              setShowForm(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            colorScheme='red'
                            onClick={() => handleDelete(species.id)}
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
    </ProtectedPage>
  )
}
