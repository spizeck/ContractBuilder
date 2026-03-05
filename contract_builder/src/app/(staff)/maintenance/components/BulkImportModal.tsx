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
import { addAsset, linkAssets, getAssets } from "@/app/(staff)/maintenance/_lib/assetsRepo";
import type { Asset } from "@/app/(staff)/maintenance/_types";

interface ImportRow {
  name: string;
  category: string;
  description?: string;
  serialNumber?: string;
  serviceTracking: "none" | "date" | "hours" | "kilometers";
  serviceIntervalDays?: number;
  serviceIntervalHours?: number;
  serviceIntervalKilometers?: number;
  lastServiceDate?: string;
  nextServiceDueDate?: string;
  parentAssetName?: string;
  active: boolean;
  metadata?: string; // JSON string for additional data
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Parse various date formats (M-D-YY, MM-DD-YYYY, etc.) to Date object
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    
    // Handle M-D-YY format (e.g., "3-12-18")
    const mdyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
    if (mdyyMatch) {
      const month = parseInt(mdyyMatch[1]) - 1; // JS months are 0-indexed
      const day = parseInt(mdyyMatch[2]);
      let year = parseInt(mdyyMatch[3]);
      // Convert 2-digit year to 4-digit year (assuming 2000s)
      year += year < 50 ? 2000 : 1900;
      return new Date(year, month, day);
    }
    
    // Handle standard format or let Date constructor handle it
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const generateTemplate = () => {
    const template = [
      {
        name: "Air Tanks",
        category: "Scuba Equipment",
        description: "Parent asset for all air tanks",
        serviceTracking: "none",
        serviceIntervalDays: "",
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "",
        nextServiceDueDate: "",
        parentAssetName: "",
        active: true,
        metadata: "",
      },
      {
        name: "Tank P420509",
        category: "Scuba Equipment",
        description: "Pro Valve",
        serialNumber: "P420509",
        serviceTracking: "date",
        serviceIntervalDays: 365,
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "2025-12-03",
        nextServiceDueDate: "2026-12-30",
        parentAssetName: "Air Tanks",
        active: true,
        metadata: '{"gasType": "air", "workingPressure": "3000psi"}',
      },
      {
        name: "Nitrox Tanks",
        category: "Scuba Equipment", 
        description: "Parent asset for all nitrox tanks",
        serviceTracking: "none",
        serviceIntervalDays: "",
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "",
        nextServiceDueDate: "",
        parentAssetName: "",
        active: true,
        metadata: "",
      },
      {
        name: "Tank N123456",
        category: "Scuba Equipment",
        description: "Pro Valve - Nitrox",
        serialNumber: "N123456",
        serviceTracking: "date",
        serviceIntervalDays: 365,
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "2025-12-03",
        nextServiceDueDate: "2026-12-30",
        parentAssetName: "Nitrox Tanks",
        active: true,
        metadata: '{"gasType": "nitrox32", "workingPressure": "3000psi"}',
      },
      {
        name: "BCD-001",
        category: "Scuba Equipment",
        description: "Buoyancy Control Device",
        serialNumber: "",
        serviceTracking: "date",
        serviceIntervalDays: 365,
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "2025-12-01",
        nextServiceDueDate: "2026-12-01",
        parentAssetName: "",
        active: true,
        metadata: "",
      },
      {
        name: "Regulator Set 001",
        category: "Scuba Equipment",
        description: "First stage regulator",
        serialNumber: "REG-001-1ST",
        serviceTracking: "date",
        serviceIntervalDays: 365,
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "2025-12-01",
        nextServiceDueDate: "2026-12-01",
        parentAssetName: "",
        active: true,
        metadata: "",
      },
      {
        name: "Second Stage 001A",
        category: "Scuba Equipment",
        description: "Primary second stage",
        serialNumber: "REG-001-2A",
        serviceTracking: "none",
        serviceIntervalDays: "",
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "",
        nextServiceDueDate: "",
        parentAssetName: "Regulator Set 001",
        active: true,
        metadata: "",
      },
      {
        name: "Second Stage 001B",
        category: "Scuba Equipment",
        description: "Octopus second stage",
        serialNumber: "REG-001-2B",
        serviceTracking: "none",
        serviceIntervalDays: "",
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "",
        nextServiceDueDate: "",
        parentAssetName: "Regulator Set 001",
        active: true,
        metadata: "",
      },
      {
        name: "Pressure Gauge 001",
        category: "Scuba Equipment",
        description: "Submersible pressure gauge",
        serialNumber: "REG-001-GAUGE",
        serviceTracking: "none",
        serviceIntervalDays: "",
        serviceIntervalHours: "",
        serviceIntervalKilometers: "",
        lastServiceDate: "",
        nextServiceDueDate: "",
        parentAssetName: "Regulator Set 001",
        active: true,
        metadata: "",
      },
    ];

    const csv = Papa.unparse(template, {
      quotes: false,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
      header: true,
      newline: "\r\n",
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scuba_equipment_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const processedRows: ImportRow[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          try {
            const processed: ImportRow = {
              name: row.name?.trim(),
              category: row.category?.trim() || "Scuba Equipment",
              description: row.description?.trim() || "",
              serialNumber: row.serialNumber?.trim() || "",
              serviceTracking: row.serviceTracking?.trim() || "none",
              serviceIntervalDays: row.serviceIntervalDays ? parseInt(row.serviceIntervalDays) : undefined,
              serviceIntervalHours: row.serviceIntervalHours ? parseInt(row.serviceIntervalHours) : undefined,
              serviceIntervalKilometers: row.serviceIntervalKilometers ? parseInt(row.serviceIntervalKilometers) : undefined,
              lastServiceDate: row.lastServiceDate?.trim() || "",
              nextServiceDueDate: row.nextServiceDueDate?.trim() || "",
              parentAssetName: row.parentAssetName?.trim() || "",
              active: row.active !== "false",
              metadata: row.metadata?.trim() || "",
            };

            // Validation
            if (!processed.name) {
              errors.push(`Row ${index + 1}: Name is required`);
              return;
            }

            if (!["none", "date", "hours", "kilometers"].includes(processed.serviceTracking)) {
              errors.push(`Row ${index + 1}: Invalid service tracking "${processed.serviceTracking}"`);
            }

            if (processed.serviceTracking === "date" && !processed.serviceIntervalDays) {
              errors.push(`Row ${index + 1}: serviceIntervalDays required for date tracking`);
            }

            if (processed.serviceTracking === "hours" && !processed.serviceIntervalHours) {
              errors.push(`Row ${index + 1}: serviceIntervalHours required for hours tracking`);
            }

            if (processed.serviceTracking === "kilometers" && !processed.serviceIntervalKilometers) {
              errors.push(`Row ${index + 1}: serviceIntervalKilometers required for kilometers tracking`);
            }

            processedRows.push(processed);
          } catch (error) {
            errors.push(`Row ${index + 1}: Processing error - ${error}`);
          }
        });

        setValidationErrors(errors);
        setPreviewData(processedRows);
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          status: "error",
          duration: 5000,
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
      // Fetch all existing assets to handle linking to existing parents
      const existingAssets = await getAssets();
      const existingParentMap: Map<string, string> = new Map();
      
      // Build name-to-id map for existing assets (prioritize parent assets)
      existingAssets.forEach(asset => {
        if (!asset.parentAssetId) { // Only consider root assets as potential parents
          if (existingParentMap.has(asset.name)) {
            console.warn(`Duplicate parent asset name found: "${asset.name}". Using first occurrence.`);
          } else {
            existingParentMap.set(asset.name, asset.id);
          }
        }
      });

      // First pass: create all parent assets
      const parentAssets: Map<string, string> = new Map(); // name -> id
      const childAssets: ImportRow[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < previewData.length; i++) {
        const row = previewData[i];
        
        if (!row.parentAssetName) {
          // This is a parent asset
          // Build asset data, filtering out undefined fields
          const assetData: Omit<Asset, "id"> = {
            name: row.name,
            category: row.category as any,
            description: row.description,
            serialNumber: row.serialNumber,
            active: row.active,
            serviceTracking: row.serviceTracking as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Only add service interval fields if they have values
          if (row.serviceIntervalDays) {
            (assetData as any).serviceIntervalDays = row.serviceIntervalDays;
          }
          if (row.serviceIntervalHours) {
            (assetData as any).serviceIntervalHours = row.serviceIntervalHours;
          }
          if (row.serviceIntervalKilometers) {
            (assetData as any).serviceIntervalKilometers = row.serviceIntervalKilometers;
          }
          if (row.lastServiceDate) {
            (assetData as any).lastServiceDate = parseDateString(row.lastServiceDate);
          }
          if (row.nextServiceDueDate) {
            (assetData as any).nextServiceDueDate = parseDateString(row.nextServiceDueDate);
          }
          if (row.metadata) {
            try {
              (assetData as any).metadata = JSON.parse(row.metadata);
            } catch {
              console.warn(`Invalid metadata for asset "${row.name}": ${row.metadata}`);
              (assetData as any).metadata = {};
            }
          }

          const docRef = await addAsset(assetData);
          parentAssets.set(row.name, docRef.id);
        } else {
          // This is a child asset
          childAssets.push(row);
        }

        // Update progress for parent creation phase
        setImportProgress(Math.round((i / previewData.length) * 50));
        
        // Batch processing with improved delay
        if (i % batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 250)); // Increased delay to avoid rate limits
        }
      }

      // Second pass: create child assets and link them
      for (let i = 0; i < childAssets.length; i++) {
        const row = childAssets[i];
        
        if (!row.parentAssetName) {
          console.warn(`Child asset "${row.name}" has no parentAssetName specified`);
          continue;
        }
        
        const parentId = parentAssets.get(row.parentAssetName ?? "") || 
                     existingParentMap.get(row.parentAssetName ?? "");
        
        if (!parentId) {
          console.warn(`Parent asset "${row.parentAssetName}" not found for child "${row.name}"`);
          continue;
        }

        // Build asset data, filtering out undefined fields
        const assetData: Omit<Asset, "id"> = {
          name: row.name,
          category: row.category as any,
          description: row.description,
          serialNumber: row.serialNumber,
          active: row.active,
          serviceTracking: row.serviceTracking as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Only add service interval fields if they have values
        if (row.serviceIntervalDays) {
          (assetData as any).serviceIntervalDays = row.serviceIntervalDays;
        }
        if (row.serviceIntervalHours) {
          (assetData as any).serviceIntervalHours = row.serviceIntervalHours;
        }
        if (row.serviceIntervalKilometers) {
          (assetData as any).serviceIntervalKilometers = row.serviceIntervalKilometers;
        }
        if (row.lastServiceDate) {
          (assetData as any).lastServiceDate = parseDateString(row.lastServiceDate);
        }
        if (row.nextServiceDueDate) {
          (assetData as any).nextServiceDueDate = parseDateString(row.nextServiceDueDate);
        }
        if (row.metadata) {
          try {
            (assetData as any).metadata = JSON.parse(row.metadata);
          } catch {
            console.warn(`Invalid metadata for asset "${row.name}": ${row.metadata}`);
            (assetData as any).metadata = {};
          }
        }

        const childRef = await addAsset(assetData);
        await linkAssets(parentId, childRef.id);

        // Update progress for child creation phase
        setImportProgress(50 + Math.round((i / childAssets.length) * 50));
        
        // Batch processing with improved delay
        if (i % batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 250)); // Increased delay to avoid rate limits
        }
      }

      toast({
        title: "Import completed successfully",
        description: `Created ${parentAssets.size} parent assets and ${childAssets.length} child assets`,
        status: "success",
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

  const resetForm = () => {
    setPreviewData([]);
    setValidationErrors([]);
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
        <ModalHeader>Bulk Import Assets</ModalHeader>
        <ModalCloseButton disabled={isImporting} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Template Download */}
            <Box>
              <Text fontWeight="bold" mb={2}>Step 1: Download Template</Text>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Download the CSV template to see the required format and examples.
              </Text>
              <Button colorScheme="blue" onClick={generateTemplate} leftIcon={<span>📥</span>}>
                Download CSV Template
              </Button>
            </Box>

            <Divider />

            {/* File Upload */}
            <Box>
              <Text fontWeight="bold" mb={2}>Step 2: Upload CSV File</Text>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                style={{ display: "none" }}
                id="csv-upload"
              />
              <Button
                as="label"
                htmlFor="csv-upload"
                colorScheme="green"
                cursor="pointer"
                disabled={isImporting}
              >
                Choose CSV File
              </Button>
            </Box>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Validation Errors</Text>
                  <VStack align="start" spacing={1} mt={2}>
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <Text key={index} fontSize="sm">• {error}</Text>
                    ))}
                    {validationErrors.length > 5 && (
                      <Text fontSize="sm">... and {validationErrors.length - 5} more errors</Text>
                    )}
                  </VStack>
                </Box>
              </Alert>
            )}

            {/* Preview */}
            {previewData.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Preview ({previewData.length} items)
                </Text>
                <TableContainer maxH="300px" overflowY="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Category</Th>
                        <Th>Parent</Th>
                        <Th>Tracking</Th>
                        <Th>Serial</Th>
                        <Th>Active</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {previewData.slice(0, 20).map((row, index) => (
                        <Tr key={index}>
                          <Td>{row.name}</Td>
                          <Td>{row.category}</Td>
                          <Td>{row.parentAssetName || "-"}</Td>
                          <Td>{row.serviceTracking}</Td>
                          <Td>{row.serialNumber || "-"}</Td>
                          <Td>{row.active ? "Yes" : "No"}</Td>
                        </Tr>
                      ))}
                      {previewData.length > 20 && (
                        <Tr>
                          <Td colSpan={6} textAlign="center" fontStyle="italic">
                            ... and {previewData.length - 20} more items
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Progress */}
            {isImporting && (
              <Box>
                <Text fontWeight="bold" mb={2}>Importing...</Text>
                <Progress value={importProgress} colorScheme="blue" />
                <Text fontSize="sm" mt={1}>{importProgress}%</Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              Cancel
            </Button>
            {previewData.length > 0 && validationErrors.length === 0 && (
              <Button
                colorScheme="blue"
                onClick={executeImport}
                disabled={isImporting}
                isLoading={isImporting}
              >
                Import {previewData.length} Assets
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
