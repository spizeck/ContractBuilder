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
import { Site } from '@/app/(staff)/dive-log/_types'
import { addSite, deleteSite, getSites, updateSite } from '@/app/(staff)/dive-log/_lib/sitesRepo'
import AddEditSiteForm from '../components/AddEditSiteForm'
import ProtectedRoute from "@shared/components/LayoutComponents/ProtectedRoute";

export default function SitesPage () {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchSites()
  }, [])

  async function fetchSites () {
    setLoading(true)
    const data = await getSites()
    const sortedSites = data.sort((a, b) => a.name.localeCompare(b.name))
    setSites(sortedSites)
    setLoading(false)
  }

  async function handleSave (data: Omit<Site, 'id'>) {
    if (editingSite) {
      await updateSite(editingSite.id, data)
    } else {
      await addSite(data)
    }
    setShowForm(false)
    setEditingSite(null)
    fetchSites()
  }

  async function handleDelete (id: string) {
    if (confirm('Are you sure you want to delete this?')) {
      await deleteSite(id)
      fetchSites()
    }
  }

  return (
    <ProtectedRoute module="diveLog" permission="edit">
      <Box p={6}>
        <Heading size='lg' mb={4}>
          Manage Sites
        </Heading>

        {loading ? (
          <Spinner />
        ) : showForm ? (
          <AddEditSiteForm
            site={editingSite || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingSite(null)
            }}
          />
        ) : (
          <>
            <Button colorScheme='teal' mb={4} onClick={() => setShowForm(true)}>
              Add Site
            </Button>
            <TableContainer>
              <Table variant='simple'>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Region</Th>
                    <Th>Habitat</Th>
                    <Th>Protected</Th>
                    <Th>Active</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sites.map(site => (
                    <Tr key={site.id}>
                      <Td>{site.name}</Td>
                      <Td>{site.region}</Td>
                      <Td>{site.habitatType}</Td>
                      <Td>{site.protectedArea ? 'Yes' : 'No'}</Td>
                      <Td>{site.active ? 'Yes' : 'No'}</Td>
                      <Td>
                        <HStack>
                          <Button
                            size='sm'
                            onClick={() => {
                              setEditingSite(site)
                              setShowForm(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            colorScheme='red'
                            onClick={() => handleDelete(site.id)}
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
