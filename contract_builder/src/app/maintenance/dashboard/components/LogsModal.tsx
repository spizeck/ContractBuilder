"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Spinner,
  Box,
  HStack,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { Asset, MaintenanceLog } from "@/types/maintenance";
import { onLogsForAsset } from "@/services/maintenance";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  // Dynamic colors for light/dark modes
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const detailsColor = useColorModeValue("gray.700", "gray.300");
  const noLogsColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (!asset) return;
    setLogs(null);

    // Aggregate logs from parent + children if available
    const ids = [asset.id, ...(asset.subAssetIds ?? [])];
    const logsMap = new Map<string, MaintenanceLog[]>();
    const unsubs = ids.map((id) =>
      onLogsForAsset(
        id,
        (arr) => {
          logsMap.set(id, arr);
          const merged = Array.from(logsMap.values()).flat();
          merged.sort((a, b) => b.date.getTime() - a.date.getTime());
          setLogs(merged);
        },
        { pageSize: 100 }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [asset?.id]);

  const goToAddLog = () => {
    if (!asset?.id) return;
    onClose();
    router.push(`/maintenance/logs/new?assetId=${asset.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{asset ? `Maintenance Logs — ${asset.name}` : "Logs"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto" pb={4}>
          {!logs ? (
            <Spinner mx="auto" display="block" />
          ) : logs.length === 0 ? (
            <Text textAlign="center" color={noLogsColor}>
              No logs found.
            </Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {logs.map((l) => (
                <Box
                  key={l.id}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  p={3}
                  bg={cardBg}
                >
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="bold">{formatDate(l.date)}</Text>
                    <Badge>{l.technicianName || "-"}</Badge>
                  </HStack>
                  <Text fontWeight="semibold">{l.summary}</Text>
                  {l.details && (
                    <Box
                      whiteSpace="pre-wrap"
                      fontSize="sm"
                      color={detailsColor}
                      mt={2}
                    >
                      {l.details}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="blue" onClick={goToAddLog} isDisabled={!asset?.id}>
            Add Log
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}
