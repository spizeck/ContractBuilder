'use client';

import {useEffect, useState} from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack
} from "@chakra-ui/react";
import {Guide} from "@/types/diveLogTypes";
import ProtectedPage from "@/components/ProtectedPage";
import {addGuide, deleteGuide, getGuides, updateGuide} from "@/services/guides";

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchGuides();
  }, []);

  async function fetchGuides() {
    setLoading(true);
    const data = await getGuides();
    setGuides(data.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    await addGuide({name: newName, active: true});
    setNewName("");
    await fetchGuides();
  }

  async function toggleActive(guide: Guide) {
    await updateGuide(guide.id, {active: !guide.active});
    await fetchGuides();
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this guide?")) {
      await deleteGuide(id);
      await fetchGuides();
    }
  }

  if (loading) return <Spinner/>;

  return (
    <ProtectedPage allowedRoles={["admin", "manager"]}>
    <Box p={6}>
      <Heading size="lg" mb={4}>Manage Guides</Heading>
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack>
          <Input
            placeholder="New guide name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={handleAdd} colorScheme="teal">Add</Button>
        </HStack>
      </VStack>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Active</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {guides.map((g) => (
            <Tr key={g.id}>
              <Td>{g.name}</Td>
              <Td>
                <Switch isChecked={g.active} onChange={() => toggleActive(g)}/>
              </Td>
              <Td>
                <Button size="sm" colorScheme="red" onClick={() => handleDelete(g.id)}>
                  Delete
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
    </ProtectedPage>
  );
}
