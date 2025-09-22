'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Site } from '@/types/diveLogTypes'

export default function ManageSitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [newSite, setNewSite] = useState({ name: '', region: '' })

  const fetchSites = async () => {
    const snapshot = await getDocs(collection(db, 'sites'))
    setSites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Site[])
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const handleAdd = async () => {
    if (!newSite.name) return
    await addDoc(collection(db, 'sites'), newSite)
    setNewSite({ name: '', region: '' })
    fetchSites()
  }

  const handleUpdate = async (id: string, name: string, region: string) => {
    await updateDoc(doc(db, 'sites', id), { name, region })
    fetchSites()
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'sites', id))
    fetchSites()
  }

  return (
    <Box maxW="600px" mx="auto" mt={8}>
      <Text fontSize="2xl" mb={4}>Manage Dive Sites</Text>

      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Site Name</FormLabel>
          <Input
            value={newSite.name}
            onChange={e => setNewSite({ ...newSite, name: e.target.value })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Region (optional)</FormLabel>
          <Input
            value={newSite.region}
            onChange={e => setNewSite({ ...newSite, region: e.target.value })}
          />
        </FormControl>
        <Button colorScheme="teal" onClick={handleAdd}>Add Site</Button>
      </VStack>

      <Box mt={8}>
        {sites.map(site => (
          <HStack key={site.id} justify="space-between" mb={2}>
            <Text>{site.name} {site.region && `(${site.region})`}</Text>
            <HStack>
              <Button
                size="sm"
                onClick={() => handleUpdate(site.id, site.name + ' Updated', site.region || '')}
              >
                Edit
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={() => handleDelete(site.id)}
              >
                Delete
              </Button>
            </HStack>
          </HStack>
        ))}
      </Box>
    </Box>
  )
}
