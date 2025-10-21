"use client"

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  HStack,
} from '@chakra-ui/react'
import { getMaintenanceLogs, deleteMaintenanceLog } from '@/services/maintenance'
import AddMaintenanceLogForm from './AddMaintenanceLogForm'
import { MaintenanceLog } from '@/types/maintenance'

export default function MaintenanceLogsPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MaintenanceLog | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await getMaintenanceLogs()
      setLogs(data)
    } catch (err) {
      console.error('Failed to load maintenance logs', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this log?')) return
    try {
      await deleteMaintenanceLog(id)
      await loadLogs()
      alert('Deleted')
    } catch (err) {
      console.error('Delete failed', err)
      alert('Failed to delete')
    }
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Maintenance Logs</Heading>

      <HStack mb={4}>
        <Button colorScheme="blue" onClick={() => setShowForm(true)}>Add Log</Button>
      </HStack>

      {loading ? (
        <Spinner />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Asset</Th>
              <Th>Technician</Th>
              <Th>Summary</Th>
              <Th>Hours</Th>
              <Th>Cost</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map(l => (
              <Tr key={l.id}>
                <Td>{new Date(l.date).toLocaleDateString()}</Td>
                <Td>{l.assetName}</Td>
                <Td>{l.technicianName}</Td>
                <Td>{l.summary}</Td>
                <Td>{l.hoursAtService ?? '-'}</Td>
                <Td>{l.cost ?? '-'}</Td>
                <Td>
                  <Button size="sm" onClick={() => { setEditing(l); setShowForm(true) }}>Edit</Button>
                  <Button size="sm" colorScheme="red" ml={2} onClick={() => handleDelete(l.id)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {showForm && (
        <AddMaintenanceLogForm onClose={() => { setShowForm(false); setEditing(null); loadLogs() }} />
      )}
    </Box>
  )
}
