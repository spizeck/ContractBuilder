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
} from "@chakra-ui/react";
import { useEffect, useState, useMemo } from "react";
import type { Asset, MaintenanceLog, Technician } from "@/app/app/maintenance/_types";
import { onLogsForAsset, deleteMaintenanceLog } from "@/app/app/maintenance/_lib/maintenanceRepo";
import { useRouter } from "next/navigation";
import { useAuth } from "@core/auth/AuthContext";
import { getTechnicians } from "@/app/app/maintenance/_lib/techniciansRepo";
import { isHoursTracked, isKmTracked } from "@/app/app/maintenance/_types";
import UpdateTrackingModal from "./UpdateTrackingModal";

export default function LogsModal({
  isOpen,
  onClose,
  asset,
  searchKeyword,
  dateRange,
}: {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  searchKeyword?: string;
  dateRange?: { from: Date | null; to: Date | null };
}) {
  const [logs, setLogs] = useState<MaintenanceLog[] | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showUpdateTrackingModal, setShowUpdateTrackingModal] = useState(false);
  const router = useRouter();
  const { user, role } = useAuth();

  // Color values now come from semantic tokens in theme

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
          setPage(0);
        },
        { pageSize: 100 }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [asset?.id]);

  const shouldLoadTechs = isOpen === true;

  useEffect(() => {
    if (!shouldLoadTechs) return;

    const loadTechs = async () => {
      try {
        const techs = await getTechnicians();
        setTechnicians(techs);
      } catch {
        setTechnicians([]);
      }
    };

    loadTechs();
  }, [shouldLoadTechs]);

  const goToAddLog = () => {
    if (!asset?.id) return;
    onClose();
    router.push(`/app/maintenance/logs/new?assetId=${asset.id}`);
  };

  const goToEditLog = (log: MaintenanceLog) => {
    onClose();
    router.push(`/app/maintenance/logs/${log.id}`);
  };

  const handleDeleteLog = async (log: MaintenanceLog) => {
    await deleteMaintenanceLog(log.id);
  };

  const openUpdateTrackingModal = () => {
    setShowUpdateTrackingModal(true);
  };

  const closeUpdateTrackingModal = () => {
    setShowUpdateTrackingModal(false);
  };

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter logs based on search keyword and date range
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    let filtered = logs;
    
    // Apply date range filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.date);
        
        if (dateRange?.from && logDate < dateRange.from) return false;
        if (dateRange?.to && logDate > dateRange.to) return false;
        
        return true;
      });
    }
    
    // Apply search keyword filter
    if (searchKeyword?.trim()) {
      const keywordLc = searchKeyword.trim().toLowerCase();
      filtered = filtered.filter((l) => {
        const haystack = [
          l.summary,
          l.details,
          l.technicianName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(keywordLc);
      });
    }
    
    return filtered;
  }, [logs, searchKeyword, dateRange]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchKeyword, dateRange]);

  const pageSize = 10;
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const pagedLogs = filteredLogs.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{asset ? `Maintenance Logs — ${asset.name}` : "Logs"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" pb={4}>
            {!logs ? (
              <Spinner mx="auto" display="block" />
            ) : filteredLogs.length === 0 ? (
              <Text textAlign="center" color="textMuted">
                {searchKeyword?.trim() ? "No logs match your search." : "No logs found."}
              </Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {pagedLogs.map((l) => {
                  const canEdit =
                    user &&
                    (user.uid === l.createdBy || role === "admin" || role === "hotel-manager");

                  const isCollapsed = !!collapsed[l.id];

                  return (
                    <Box
                      key={l.id}
                      borderWidth="1px"
                      borderColor="border"
                      borderRadius="md"
                      p={3}
                      bg="cardBg"
                      color="textPrimary"
                      _hover={{ bg: "bgHover" }}
                      transition="background-color 0.2s"
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text fontWeight="bold" color="textPrimary">{formatDate(l.date)}</Text>
                        <HStack spacing={2}>
                          <Badge colorScheme="gray">
                            {l.technicianName ||
                              technicians.find((t) => t.id === l.technicianId)?.name ||
                              ""}
                          </Badge>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => toggleCollapsed(l.id)}
                          >
                            {isCollapsed ? "+" : "-"}
                          </Button>
                        </HStack>
                      </HStack>
                      <Text fontWeight="semibold" color="textPrimary">{l.summary}</Text>
                      {!isCollapsed && l.details && (
                        <Box
                          whiteSpace="pre-wrap"
                          fontSize="sm"
                          color="textPrimary"
                          mt={2}
                        >
                          {l.details}
                        </Box>
                      )}
                      {!isCollapsed && (
                        <HStack mt={3} justify="flex-end" spacing={2}>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedLog(l);
                              setShowViewModal(true);
                            }}
                          >
                            View
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => goToEditLog(l)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleDeleteLog(l)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </HStack>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {filteredLogs.length > pageSize && (
              <HStack flex="1" spacing={3} mr={4}>
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  isDisabled={page === 0}
                >
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {page + 1} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(totalPages - 1, p + 1)
                    )
                  }
                  isDisabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </HStack>
            )}
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {asset && (isHoursTracked(asset) || isKmTracked(asset)) && (
              <Button 
                variant="outline" 
                mr={3} 
                onClick={openUpdateTrackingModal}
                isDisabled={!asset?.id}
              >
                Update {isHoursTracked(asset) ? "Hours" : "Kilometers"}
              </Button>
            )}
            <Button colorScheme="blue" onClick={goToAddLog} isDisabled={!asset?.id}>
              Add Log
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {selectedLog && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedLog(null);
          }}
          size="md"
        >
          <ModalOverlay />
          <ModalContent bg="cardBg" color="textPrimary">
            <ModalHeader>View Log</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" color="textPrimary">
                  {formatDate(selectedLog.date)} — {selectedLog.summary}
                </Text>
                <Text color="textMuted">
                  Technician: {selectedLog.technicianName ||
                    technicians.find((t) => t.id === selectedLog.technicianId)?.name ||
                    "-"}
                </Text>
                {selectedLog.details && (
                  <Box
                    whiteSpace="pre-wrap"
                    p={2}
                    borderWidth={1}
                    borderColor="border"
                    borderRadius="md"
                    bg="cardBg"
                    color="textMuted"
                  >
                    {selectedLog.details}
                  </Box>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <UpdateTrackingModal
        isOpen={showUpdateTrackingModal}
        onClose={closeUpdateTrackingModal}
        asset={asset}
      />
    </>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}
