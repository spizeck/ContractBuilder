"use client";

import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Box,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  IconButton,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { useAuth } from "@/context/AuthContext";
import {
  addContractNote,
  getContractNotes,
  deleteContractNote,
} from "@/services/payments";
import { ContractNote } from "@/types/contractTypes";
import { formatDateTime } from "@/utils/datetime";

interface ContractNotesProps {
  contractId: string;
}

export default function ContractNotes({ contractId }: ContractNotesProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [notes, setNotes] = useState<ContractNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [contractId]);

  const fetchNotes = async () => {
    try {
      const notesData = await getContractNotes(contractId);
      setNotes(notesData);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    setIsAdding(true);
    try {
      const note = await addContractNote(
        contractId,
        newNote.trim(),
        user.uid,
        user.displayName || user.email || undefined
      );

      setNotes([note, ...notes]);
      setNewNote("");

      toast({
        title: "Note added",
        description: "Your note has been added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to add note",
        description: "There was an error adding your note",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteContractNote(contractId, noteId);
      setNotes(notes.filter((note) => note.id !== noteId));

      toast({
        title: "Note deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to delete note",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Contract Notes
      </Text>

      <VStack spacing={4} align="stretch">
        {/* Add Note Form */}
        <Box>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this contract..."
            rows={3}
            mb={3}
          />
          <Button
            colorScheme="blue"
            onClick={handleAddNote}
            isLoading={isAdding}
            loadingText="Adding Note..."
            isDisabled={!newNote.trim()}
          >
            Add Note
          </Button>
        </Box>

        <Divider />

        {/* Notes List */}
        {notes.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No notes yet. Add the first note above.
          </Alert>
        ) : (
          <VStack spacing={3} align="stretch">
            {notes.map((note) => (
              <Box
                key={note.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg="cardBg"
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2} flex={1}>
                    <Text whiteSpace="pre-wrap">{note.text}</Text>
                    <Text fontSize="xs" color="textPrimary">
                      {note.createdByName || note.createdBy} •{" "}
                      {formatDateTime(note.createdAt)}
                    </Text>
                  </VStack>
                  <IconButton
                    aria-label="Delete note"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeleteNote(note.id)}
                  />
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
