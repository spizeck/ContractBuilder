'use client'

import {useEffect, useState} from "react";
import {Box, Button, Heading, HStack, Spinner, Table, Tbody, Td, Th, Thead, Tr, TableContainer, Flex, Text} from '@chakra-ui/react'
import {deleteTechnician, getTechniciansPaginated, PaginatedTechniciansResult} from "@/services/technicians";
import {Technician} from "@/types/maintenance";
import AddEditTechnicianForm from "../components/AddEditTechnicianForm";
import {DocumentSnapshot} from "firebase/firestore";

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState<PaginatedTechniciansResult | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDocs, setPageDocs] = useState<DocumentSnapshot[]>([]);
  const pageSize = 10;

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const startAfterDoc = currentPage > 0 && pageDocs[currentPage - 1] ? pageDocs[currentPage - 1] : undefined;
      const result = await getTechniciansPaginated(pageSize, startAfterDoc);
      setPagination(result);
      setTechnicians(result.technicians);
      
      // Update page docs array for navigation
      if (result.lastDoc) {
        const newPageDocs = [...pageDocs];
        newPageDocs[currentPage] = result.lastDoc;
        setPageDocs(newPageDocs);
      }
    } catch (error) {
      console.error("Failed to fetch technicians:", error);
      setTechnicians([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this technician?")) {
      await deleteTechnician(id);
      // Reset to first page after deletion
      setCurrentPage(0);
      setPageDocs([]);
      setPagination(null);
      await loadTechnicians();
    }
  }

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Box p={6} h="full" display="flex" flexDirection="column">
      <Heading size='lg' mb={4}>Technicians</Heading>
      <HStack mb={4}>
        <Button size="sm" onClick={() => setShowForm(true)}>Add Technician</Button>
      </HStack>

      {loading ? (
        <Spinner/>
      ) : (
        <>
          <Box flex={1} overflow="hidden">
            <TableContainer overflow="auto" h="full">
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
            </TableContainer>
          </Box>

          {/* Pagination Controls */}
          <Flex justify="space-between" align="center" mt={4} pt={4} borderTop="1px" borderColor="gray.200">
            <Text fontSize="sm" color="gray.600">
              Page {currentPage + 1} • Showing {technicians.length} technicians
            </Text>
            <HStack>
              <Button
                size="sm"
                onClick={handlePrevPage}
                isDisabled={currentPage === 0}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                size="sm"
                onClick={handleNextPage}
                isDisabled={!pagination?.hasNextPage}
                variant="outline"
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </>
      )}
      {showForm && (
        <AddEditTechnicianForm
          onClose={() => {
            setShowForm(false)
            setEditingTechnician(null)
            // Reset to first page after adding/editing
            setCurrentPage(0);
            setPageDocs([]);
            setPagination(null);
            loadTechnicians()
          }}
          technician={editingTechnician}
        />
      )}
    </Box>
  )

}