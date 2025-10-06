'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Spinner
} from '@chakra-ui/react'
import { getAssets, deleteAsset } from '@/services/assets'
import { Asset } from '@/types/maintenance'
import AddEditAssetForm from './AddEditAssetForm'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [])

  async function loadAssets() {
    setLoading(true)
    try {
      const assetsData = await getAssets()
      setAssets(assetsData)
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this asset?')) {
      await deleteAsset(id)
      await loadAssets()
    }
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Assets</Heading>
      <HStack mb={4}>
        <Button colorScheme="blue" onClick={() => setShowForm(true)}>Add Asset</Button>
      </HStack>

      {loading ? (
        <Spinner />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {assets.map(a => (
              <Tr key={a.id}>
                <Td>{a.name}</Td>
                <Td>{a.category}</Td>
                <Td>{a.active ? 'Yes' : 'No'}</Td>
                <Td>
                  <Button size="sm" onClick={() => { setEditingAsset(a); setShowForm(true) }}>Edit</Button>
                  <Button size="sm" colorScheme="red" ml={2} onClick={() => handleDelete(a.id)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {showForm && (
        <AddEditAssetForm
          asset={editingAsset}
          onClose={() => { setShowForm(false); setEditingAsset(null); loadAssets() }}
        />
      )}
    </Box>
  )
}
