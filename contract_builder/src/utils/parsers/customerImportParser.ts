import Papa, { ParseResult } from "papaparse";
import { parseCheckfrontCSV } from "./checkfrontParser";
import type { Customer, ImportJob } from "@/types/manifestTypes";

export interface CustomerImportResult {
  customers: Customer[];
  importJob: ImportJob;
  errors: string[];
}

/**
 * Parse customer import CSV file and return parsed customers with job status
 */
export async function parseCustomerImportFile(
  file: File
): Promise<CustomerImportResult> {
  return new Promise((resolve) => {
    const newJob: ImportJob = {
      id: Date.now().toString(),
      status: "processing",
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
      fileName: file.name,
      createdAt: new Date(),
    };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<any>) => {
        console.log("CSV parsing results:", results);

        if (results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);
          resolve({
            customers: [],
            importJob: {
              ...newJob,
              status: "failed",
              errors: results.errors.map((err: any) => err.message),
            },
            errors: results.errors.map((err: any) => err.message),
          });
          return;
        }

        // Parse Checkfront data using equipmentParser
        const parsedCustomers = parseCheckfrontCSV(results.data);
        console.log("Parsed customers:", parsedCustomers);

        // Update import job with actual counts
        const completedJob: ImportJob = {
          ...newJob,
          status: "completed",
          totalRecords: results.data.length,
          processedRecords: parsedCustomers.length,
          errors:
            parsedCustomers.length < results.data.length
              ? [`Failed to parse ${results.data.length - parsedCustomers.length} records`]
              : [],
        };

        resolve({
          customers: parsedCustomers,
          importJob: completedJob,
          errors: completedJob.errors,
        });
      },
      error: (error: any) => {
        console.error("File reading error:", error);
        resolve({
          customers: [],
          importJob: {
            ...newJob,
            status: "failed",
            errors: [error.message],
          },
          errors: [error.message],
        });
      },
    });
  });
}

/**
 * Generate CSV template for customer import
 */
export function generateCustomerImportTemplate(): string {
  return `Booking Reference,First Name,Last Name,Email,Phone,Hotel,Room Number,Certification Level,Nitrox Certified,BCD,Regulator,Mask,Fins,Wetsuit,Other Equipment,Special Requirements
BK001,John,Doe,john@example.com,+1234567890,Sea Saba Resort,101,Open Water,Yes,Yes,Yes,No,No,Yes,,
BK002,Jane,Smith,jane@example.com,+1234567891,Sea Saba Resort,102,Advanced,No,Yes,Yes,Yes,Yes,Yes,`;
}

/**
 * Download customer import template as CSV file
 */
export function downloadCustomerImportTemplate(): void {
  const csvContent = generateCustomerImportTemplate();
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customer-import-template.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}
