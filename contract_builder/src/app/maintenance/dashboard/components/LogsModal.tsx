"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Text,
  Spinner,
  Box,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { Asset, MaintenanceLog } from "@/types/maintenance";
import { onLogsForAsset } from "@/services/maintenance";

export default function LogsModal({
  isOpen,
  onClose,
  asset,
}: {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}) {
  const [logs, setLogs] = useState<MaintenanceLog[] | null>(null);

  useEffect(() => {
    if (!asset) return;
    setLogs(null);

    // Aggregate logs from parent + children if available
    const ids = [asset.id, ...(asset.subAssetIds ?? [])];
    const logsMap = new Map<string, MaintenanceLog[]>();
    const unsubs = ids.map((id) =>
      onLogsForAsset(id, (arr) => {
        logsMap.set(id, arr);
        const merged = Array.from(logsMap.values()).flat();
        // sort most recent first
        merged.sort((a, b) => b.date.getTime() - a.date.getTime());
        setLogs(merged);
      }, { pageSize: 100 })
    );

    return () => unsubs.forEach(u => u());
  }, [asset?.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>{asset ? `Logs — ${asset.name}` : "Logs"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          {!logs ? (
            <Spinner />
          ) : logs.length === 0 ? (
            <Text color="gray.500">No logs found.</Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {logs.map((l) => (
                <Box key={l.id} borderWidth="1px" borderRadius="md" p={3}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="bold">{formatDate(l.date)}</Text>
                    <Badge>{l.technicianName || "-"}</Badge>
                  </HStack>
                  <Text fontWeight="semibold">{l.summary}</Text>
                  {l.details && (
                    <Box whiteSpace="pre-wrap" fontSize="sm" color="gray.700" mt={2}>
                      {l.details}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
}