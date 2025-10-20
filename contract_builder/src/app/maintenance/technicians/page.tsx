'use client'

import {useEffect, useState} from "react";
import {Box, Button, Heading, HStack, Spinner, Table, Tbody, Td, Th, Thead, Tr} from '@chakra-ui/react'
import {deleteTechnician, getTechnicians} from "@/services/technicians";
import {Technician} from "@/types/maintenance";
import AddEditTechnicianForm from "@/app/maintenance/technicians/AddEditTechnicianForm";

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function loadTechnicians() {
    setLoading(true);
    try {
      const techniciansData = await getTechnicians();
      setTechnicians(techniciansData);
    } catch (error) {
      console.error("Failed to fetch technicians:", error);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this technician?")) {
      await deleteTechnician(id);
      await loadTechnicians();
    }
  }

  return (
    <Box p={6}>
      <Heading size='lg' mb={4}>Technicians</Heading>
      <HStack mb={4}>
        <Button size="sm" onClick={() => setShowForm(true)}>Add Technician</Button>
      </HStack>

      {loading ? (
        <Spinner/>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Certifications</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>

          <Tbody>
            {technicians.map(t => (
              <Tr key={t.id}>
                <Td>{t.name}</Td>
                <Td>{t.role}</Td>
                <Td>{t.certifications || ""}</Td>
                <Td>
                  <Button size="sm" onClick={() => {
                    setEditingTechnician(t)
                    setShowForm(true)
                  }}>Edit</Button>
                  <Button size="sm" colorScheme="red" ml={2} onClick={() => handleDelete(t.id)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {showForm && (
        <AddEditTechnicianForm
          onClose={() => {
            setShowForm(false)
            setEditingTechnician(null)
            loadTechnicians()
          }}
          technician={editingTechnician}
        />
      )}
    </Box>

  )

}