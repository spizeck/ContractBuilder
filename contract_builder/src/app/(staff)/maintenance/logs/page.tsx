"use client";

import { useEffect, useState, useRef } from "react";
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
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Text,
  Input,
  Select,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Stack,
  TableContainer,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import {
  getMaintenanceLogs,
  deleteMaintenanceLog,
} from "@/app/(staff)/maintenance/_lib/maintenanceRepo";
import { getAssets } from "@/app/(staff)/maintenance/_lib/assetsRepo";
import { getTechnicians } from "@/app/(staff)/maintenance/_lib/techniciansRepo";
import { MaintenanceLog, Asset } from "@/app/(staff)/maintenance/_types";
import { Technician } from "@/app/(staff)/maintenance/_types";
import { formatDate, formatNumber, formatCurrency } from "@shared/utils/formatters";
import { useAuth } from "@core/auth/AuthContext"; // << added
import BulkImportLogModal from "@/app/(staff)/maintenance/components/BulkImportLogModal";

export default function MaintenanceLogsPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const {
    isOpen: isDeleteOpen,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure();
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const toast = useToast();
  const router = useRouter();

  // auth (for permissions)
  const { user, role } = useAuth();

  // view single-log modal state (read-only)
  const [viewLog, setViewLog] = useState<MaintenanceLog | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // also load technicians so we can display names when logs don't contain technicianName
      const [a, l, t] = await Promise.all([getAssets(), getMaintenanceLogs(), getTechnicians()]);
      setAssets(a);
      setLogs(l);
      setTechnicians(t);
    } catch (err) {
      console.error("Failed to load assets or logs", err);
      setAssets([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLog(id: string) {
    setDeletingLogId(id);
    onOpenDelete();
  }

  async function confirmDelete() {
    if (!deletingLogId) return;
    try {
      await deleteMaintenanceLog(deletingLogId);
      await loadAll();
      toast({
        title: "Deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Delete failed", err);
      toast({
        title: "Failed to delete",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeletingLogId(null);
      onCloseDelete();
    }
  }

  const openAddForAsset = (asset: Asset | null) => {
    if (asset) {
      router.push(`/maintenance/logs/new?assetId=${asset.id}`);
    } else {
      router.push("/maintenance/logs/new");
    }
  };

  const openEditLog = (log: MaintenanceLog) => {
    router.push(`/maintenance/logs/${log.id}`);
  };

  const openLogsForAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowLogsModal(true);
  };

  const logsForAsset = (assetId: string) =>
    logs
      .filter((l) => l.assetId === assetId)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Maintenance - Assets & Logs
      </Heading>

      <HStack mb={4}>
        <Button colorScheme="blue" onClick={() => openAddForAsset(null)}>
          Add Log
        </Button>
        <Button colorScheme="teal" onClick={() => setIsBulkImportOpen(true)}>
          Bulk Import Logs
        </Button>
      </HStack>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <HStack mb={4} spacing={4}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              width="200px"
              placeholder="All categories"
            >
              {[...new Set(assets.map((a) => a.category))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Input
              placeholder="Search asset name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              width="300px"
            />
          </HStack>

          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Asset</Th>
                  <Th>Category</Th>
                  <Th>Current Hours</Th>
                  <Th>Next Service Due</Th>
                  <Th>Last Update</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {renderedRootRows(
                  assets,
                  logs,
                  categoryFilter,
                  searchQuery,
                  openLogsForAsset,
                  openAddForAsset,
                  user,
                  role
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* View Logs Modal */}
      <Modal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Logs for {selectedAsset?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack align="stretch">
              {selectedAsset && logsForAsset(selectedAsset.id).length === 0 && (
                <Text>No logs for this asset.</Text>
              )}

              {selectedAsset &&
                logsForAsset(selectedAsset.id).map((l) => {
                  // permission: who can edit/delete this log?
                  const canEdit =
                    user &&
                    (user.uid === l.createdBy || role === "admin" || role === "hotel-manager");
                  // technician name: prefer stored technicianName, fall back to lookup by id
                  const techName =
                    l.technicianName ||
                    technicians.find((tt) => tt.id === l.technicianId)?.name ||
                    "-";

                  return (
                    <Box key={l.id} p={3} borderWidth={1} borderRadius="md">
                      <Text fontWeight="bold">
                        {formatDate(l.date as any)} — {l.summary}
                      </Text>
                      <Text>Technician: {techName}</Text>
                      <Text>
                        Hours:{" "}
                        {l.hoursAtService != null
                          ? formatNumber(l.hoursAtService, 2)
                          : "-"}
                      </Text>
                      <Text>
                        Next Service Due:{" "}
                        {l.nextServiceDue != null
                          ? formatNumber(l.nextServiceDue, 2)
                          : "-"}
                      </Text>
                      <Text>
                        Cost:{" "}
                        {l.cost != null ? `$${formatCurrency(l.cost)}` : "-"}
                      </Text>
                      <HStack mt={2}>
                        <Button
                          size="sm"
                          onClick={() => {
                            setViewLog(l);
                            setShowViewModal(true);
                          }}
                        >
                          View
                        </Button>

                        {canEdit && (
                          <>
                            <Button
                              size="sm"
                              colorScheme="yellow"
                              onClick={() => openEditLog(l)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteLog(l.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </HStack>
                    </Box>
                  );
                })}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Single Log View Modal (read-only) */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setViewLog(null);
          setShowViewModal(false);
        }}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>View Log</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewLog ? (
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold">
                  {formatDate(viewLog.date as any)} — {viewLog.summary}
                </Text>
                {/* fallback to technician lookup if technicianName missing on the log */}
                <Text>
                  Technician:{" "}
                  {viewLog.technicianName ||
                    technicians.find((t) => t.id === viewLog.technicianId)?.name ||
                    "-"}
                </Text>
                <Text>
                  Hours:{" "}
                  {viewLog.hoursAtService != null
                    ? formatNumber(viewLog.hoursAtService, 2)
                    : "-"}
                </Text>
                <Text>
                  Next Service Due:{" "}
                  {viewLog.nextServiceDue != null
                    ? formatNumber(viewLog.nextServiceDue, 2)
                    : "-"}
                </Text>
                <Text>Cost: {viewLog.cost != null ? `$${formatCurrency(viewLog.cost)}` : "-"}</Text>
                <Text>Details:</Text>
                <Box whiteSpace="pre-wrap" p={2} borderWidth={1} borderRadius="md">
                  {viewLog.details || "-"}
                </Box>
              </VStack>
            ) : (
              <Text>No log selected.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef as any}
        onClose={onCloseDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Maintenance Log
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this maintenance log? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef as any} onClick={onCloseDelete}>
                Cancel
              </Button>
              <Button colorScheme="red" ml={3} onClick={confirmDelete}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      <BulkImportLogModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={() => window.location.reload()}
      />
    </Box>
  );
}

// --- Helper to render asset hierarchy ---
function renderedRootRows(
  assets: Asset[],
  logs: MaintenanceLog[],
  categoryFilter: string,
  searchQuery: string,
  onViewLogs: (a: Asset) => void,
  onAddLog: (a: Asset | null) => void,
  user: any,
  role: string | undefined
) {
  const grouped = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    const key = asset.parentAssetId || "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {});

  const root = grouped["root"] || [];

  return root
    .filter((a) => (categoryFilter ? a.category === categoryFilter : true))
    .filter((a) =>
      searchQuery
        ? a.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .map((a) => (
      <ParentRow
        key={a.id}
        asset={a}
        groupedAssets={grouped}
        logs={logs}
        onViewLogs={onViewLogs}
        onAddLog={onAddLog}
        level={0}
        user={user}
        role={role}
      />
    ));
}

function ParentRow({
  asset,
  groupedAssets,
  logs,
  onViewLogs,
  onAddLog,
  level = 0,
  user,
  role,
}: {
  asset: Asset;
  groupedAssets: Record<string, Asset[]>;
  logs: MaintenanceLog[];
  onViewLogs: (a: Asset) => void;
  onAddLog: (a: Asset | null) => void;
  level?: number;
  user?: any;
  role?: string;
}) {
  const assetLogs = logs
    .filter((l) => l.assetId === asset.id)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const lastLog = assetLogs[0];
  // Consider both maintenance logs AND asset updates (hour/km updates set updatedAt)
  const lastLogDate = lastLog?.date;
  const assetUpdateDate = asset.updatedAt;
  const lastServiceDate = asset.lastServiceDate;
  const lastDate = [lastLogDate, assetUpdateDate, lastServiceDate]
    .filter((d): d is Date => !!d)
    .sort((a, b) => +b - +a)[0];
  const nextDue = lastLog?.nextServiceDue ?? asset.nextServiceDue;

  // Current hours: prefer most recent log hours, fall back to asset.hours or asset.currentHours
  const currentHours =
    lastLog?.hoursAtService ??
    (asset as any).hours ??
    (asset as any).currentHours ??
    null;

  return (
    <>
      <Tr>
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          {level > 0 && "↳ "}
          {asset.name}
        </Td>
        <Td>{asset.category}</Td>
        <Td>{currentHours != null ? formatNumber(currentHours as any, 2) : "-"}</Td>
        <Td>{nextDue != null ? formatNumber(nextDue as any, 2) : "-"}</Td>
        <Td>{lastDate ? formatDate(lastDate as any) : "-"}</Td>
        <Td>
          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={{ base: 2, md: 1 }}
            align="stretch"
          >
            <Button
              size="sm"
              w={{ base: "100%", md: "auto" }}
              onClick={() => onViewLogs(asset)}
              variant="outline"
            >
              View Logs
            </Button>
            <Button
              size="sm"
              w={{ base: "100%", md: "auto" }}
              colorScheme="blue"
              onClick={() => onAddLog(asset)}
            >
              Add Log
            </Button>
          </Stack>
        </Td>
      </Tr>

      {(groupedAssets[asset.id] || []).map((child) => (
        <ParentRow
          key={child.id}
          asset={child}
          groupedAssets={groupedAssets}
          logs={logs}
          onViewLogs={onViewLogs}
          onAddLog={onAddLog}
          level={level + 1}
          user={user}
          role={role}
        />
      ))}
    </>
  );
}
