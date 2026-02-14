"use client";

import { useState, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Progress,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Divider,
} from "@chakra-ui/react";
import Papa from "papaparse";
import { addMaintenanceLog } from "@/services/maintenance";
import { getAssets } from "@/services/assets";
import { getTechnicians } from "@/services/technicians";
import type { Asset, Technician, MaintenanceLog } from "@/types/maintenance";

interface ImportRow {
  assetName: string;
  date: { normalized: string; isValid: boolean; original: string };
  summary: string;
  kind: "service" | "unscheduled" | "inspection" | "note";
  cost?: number;
  technicianName?: string;
  details?: string;
  hoursUsed?: number;
  kilometersUsed?: number;
  nextServiceDueDate: { normalized: string; isValid: boolean; original: string };
}

interface BulkImportLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function BulkImportLogModal({
  isOpen,
  onClose,
  onImportComplete,
}: BulkImportLogModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "text/csv" || file.name.toLowerCase().endsWith('.csv'))) {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const normalizeDate = (dateStr: string): { normalized: string; isValid: boolean; original: string } => {
  if (!dateStr) return { normalized: "", isValid: false, original: dateStr };
  
  const original = dateStr;
  
  // Handle Excel numeric dates (days since 1900-01-01)
  if (/^\d+$/.test(dateStr.trim())) {
    const days = parseInt(dateStr.trim());
    const excelEpoch = new Date(1900, 0, 1); // 1900-01-01
    const date = new Date(excelEpoch.getTime() + (days - 2) * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return { normalized: date.toISOString().split('T')[0], isValid: true, original };
    }
  }
  
  // Try mm/dd/yyyy format first (most common in US spreadsheets)
  const mmddyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    // Validate month and day ranges
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        return { normalized: date.toISOString().split('T')[0], isValid: true, original };
      }
    }
    
    // If mm/dd/yyyy fails, try dd/mm/yyyy
    if (dayNum >= 1 && dayNum <= 12 && monthNum >= 1 && monthNum <= 31) {
      const date = new Date(`${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        return { normalized: date.toISOString().split('T')[0], isValid: true, original };
      }
    }
  }
  
  // Try yyyy-mm-dd format (already correct)
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return { normalized: date.toISOString().split('T')[0], isValid: true, original };
    }
  }
  
  // If no format matches, return invalid
  return { normalized: dateStr, isValid: false, original };
};

const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const processedData: ImportRow[] = data.map((row: any) => ({
          assetName: row.assetName || "",
          date: normalizeDate(row.date || ""),
          summary: row.summary || "",
          kind: (row.kind || "service") as "service" | "unscheduled" | "inspection" | "note",
          cost: row.cost ? parseFloat(row.cost) : undefined,
          technicianName: row.technicianName || "",
          details: row.details || "",
          hoursUsed: row.hoursUsed ? parseFloat(row.hoursUsed) : undefined,
          kilometersUsed: row.kilometersUsed ? parseFloat(row.kilometersUsed) : undefined,
          nextServiceDueDate: normalizeDate(row.nextServiceDueDate || ""),
        }));
        setPreviewData(processedData);
      },
      error: (error) => {
        toast({
          title: "Parse error",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    });
  };

  const executeImport = async () => {
    if (previewData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Get assets and technicians for matching
      const [assets, technicians] = await Promise.all([
        getAssets(),
        getTechnicians(),
      ]);

      const assetMap = new Map(assets.map((a: Asset) => [a.name.toLowerCase(), a]));
      const technicianMap = new Map(technicians.map((t: Technician) => [t.name.toLowerCase(), t]));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < previewData.length; i++) {
        const row = previewData[i];
        
        try {
          // Skip rows with invalid dates
          if (!row.date.isValid) {
            console.warn(`Invalid date "${row.date.original}" for asset "${row.assetName}"`);
            errorCount++;
            continue;
          }
          
          // Find asset (strip category suffix if present)
          const cleanAssetName = row.assetName.replace(/\s*\([^)]*\)\s*$/, '').trim();
          const asset = assetMap.get(cleanAssetName.toLowerCase());
          
          if (!asset) {
            console.warn(`Asset "${row.assetName}" not found for log on ${row.date.original}`);
            errorCount++;
            continue;
          }

          // Find technician
          let technicianId = null;
          if (row.technicianName) {
            const technician = technicianMap.get(row.technicianName.toLowerCase());
            if (technician) {
              technicianId = technician.id;
            } else {
              console.warn(`Technician "${row.technicianName}" not found`);
            }
          }

          // Create maintenance log
          const logData: Omit<MaintenanceLog, "id"> = {
            assetId: asset.id,
            assetName: asset.name,
            category: asset.category,
            kind: row.kind,
            date: new Date(row.date.normalized),
            summary: row.summary,
            details: row.details || "",
            technicianId: technicianId || undefined,
            cost: row.cost || 0,
            createdBy: "bulk-import",
            createdAt: new Date(),
          };

          await addMaintenanceLog(logData);
          successCount++;

          // Update asset service tracking if provided
          if (row.nextServiceDueDate.isValid && row.nextServiceDueDate.normalized && asset.serviceTracking === "date") {
            // This would require an updateAsset service call
            console.log(`Would update next service due date for ${asset.name} to ${row.nextServiceDueDate.normalized}`);
          }

        } catch (error) {
          console.error(`Error importing log for ${row.assetName}:`, error);
          errorCount++;
        }

        // Update progress
        setImportProgress(Math.round(((i + 1) / previewData.length) * 100));
        
        // Small delay to avoid rate limiting
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} logs${errorCount > 0 ? ` (${errorCount} errors)` : ""}`,
        status: errorCount === 0 ? "success" : "warning",
        duration: 5000,
        isClosable: true,
      });

      onImportComplete();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `assetName,date,summary,kind,cost,technicianName,details,hoursUsed,kilometersUsed,nextServiceDueDate
"Boat Engine","01/15/2024","Oil change and filter replacement","service",150.00,"John Doe","Changed oil and oil filter, checked fluid levels",,,,04/15/2024
"Scuba Tank #1","01/20/2024","Annual inspection and certification","inspection",75.00,"Jane Smith","Visual inspection, hydrostatic test completed",,,,
"Compressor Unit","01/25/2024","Emergency repair - air leak","unscheduled",300.00,"Mike Johnson","Replaced damaged air hose and fittings",,,`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maintenance_logs_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetForm = () => {
    setCsvFile(null);
    setPreviewData([]);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Bulk Import Maintenance Logs</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* File Upload */}
            <Box>
              <Text fontWeight="bold" mb={2}>
                Select CSV File
              </Text>
              <HStack spacing={3}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose CSV File
                </Button>
                <Button
                  colorScheme="gray"
                  variant="outline"
                  onClick={downloadTemplate}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  }
                >
                  Download Template
                </Button>
              </HStack>
              {csvFile && (
                <Text ml={4} display="inline-block" mt={2}>
                  {csvFile.name}
                </Text>
              )}
            </Box>

            {/* CSV Format Instructions */}
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">CSV Format:</Text>
                <Text fontSize="sm">
                  assetName, date, summary, kind, cost, technicianName, details, hoursUsed, kilometersUsed, nextServiceDueDate
                </Text>
                <Text fontSize="sm" mt={1}>
                  Required: assetName, date, summary | Optional: kind (service/unscheduled/inspection/note), cost, technicianName, details, hoursUsed, kilometersUsed, nextServiceDueDate
                </Text>
                <Text fontSize="sm" mt={1}>
                  Date formats: mm/dd/yyyy, dd/mm/yyyy, yyyy-mm-dd, or Excel numeric dates
                </Text>
              </Box>
            </Alert>

            {/* Preview Table */}
            {previewData.length > 0 && (
              <>
                <Divider />
                <Text fontWeight="bold">Preview ({previewData.length} rows)</Text>
                <TableContainer maxH="300px" overflowY="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Asset</Th>
                        <Th>Date</Th>
                        <Th>Normalized Date</Th>
                        <Th>Summary</Th>
                        <Th>Kind</Th>
                        <Th>Cost</Th>
                        <Th>Technician</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <Tr key={index}>
                          <Td>{row.assetName}</Td>
                          <Td color={row.date.isValid ? 'inherit' : 'red.500'}>
                            {row.date.original}
                          </Td>
                          <Td color={row.date.isValid ? 'green.600' : 'red.500'}>
                            {row.date.isValid ? row.date.normalized : 'Invalid'}
                          </Td>
                          <Td>{row.summary}</Td>
                          <Td>{row.kind}</Td>
                          <Td>{row.cost || "-"}</Td>
                          <Td>{row.technicianName || "-"}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  {previewData.length > 10 && (
                    <Text textAlign="center" fontSize="sm" color="gray.500" mt={2}>
                      ... and {previewData.length - 10} more rows
                    </Text>
                  )}
                </TableContainer>
              </>
            )}

            {/* Progress */}
            {isImporting && (
              <>
                <Divider />
                <Text fontWeight="bold">Importing...</Text>
                <Progress value={importProgress} hasStripe isAnimated />
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={handleClose} variant="ghost" isDisabled={isImporting}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={executeImport}
            isDisabled={previewData.length === 0 || isImporting}
            isLoading={isImporting}
          >
            Import {previewData.length} Logs
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
