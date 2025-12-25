import { EquipmentNeeds, EquipmentItem, Customer } from '@/types/manifestTypes';
import { normalizeName, normalizeEmail, normalizePhone } from '@/utils/stringUtils';
import { getFirstValue, calculateSimilarity } from './csvHelpers';

// Equipment mapping objects for precise parsing
const BCD_MAPPINGS: Record<string, string> = {
  // Own equipment
  "I have my own BCD": "Own",
  
  // Wing style
  "Rental – One Size (Backplate/Wing Style, Weight-Integrated)": "Wing",
  
  // Old format rentals
  "I need a XXS Rental": "XXS",
  "I need a XS Rental": "XS",
  "I need a Small Rental": "S",
  "I need a Medium Rental": "M",
  "I need a Large Rental": "L",
  "I need a XL Rental": "XL",
  "I need a XXL Rental": "XXL",
  
  // New format rentals
  "Rental – XXS (Jacket Style, Weight-Belt)": "XXS",
  "Rental – XS (Jacket Style, Weight-Belt)": "XS",
  "Rental – Small (Jacket Style, Weight-Belt)": "S",
  "Rental – Medium (Jacket Style, Weight-Belt)": "M",
  "Rental – Large (Jacket Style, Weight-Belt)": "L",
  "Rental – XL (Jacket Style, Weight-Belt)": "XL",
  "Rental – XXL (Jacket Style, Weight-Belt)": "XXL"
};

const REGULATOR_MAPPINGS: Record<string, string> = {
  "I have my Own Regulator": "Own",
  "I need a rental Regulator": "NEED",
  "Rental - Regulator Set": "NEED"
};

const WETSUIT_MAPPINGS: Record<string, string> = {
  // Own equipment
  "I have my own Wetsuit": "Own",
  
  // Unisex sizes
  "I need a XS Rental": "XS",
  "I need a Small Rental": "S",
  "I need a Medium Rental": "M",
  "I need a Large Rental": "L",
  "I need a XL Rental": "XL",
  "I need a XXL Rental": "XXL",
  
  // Women's sizes
  "Rental – Women's XS": "WXS",
  "Rental – Women's Small": "WS",
  "Rental – Women's Medium": "WM",
  "Rental – Women's Large": "WL",
  "Rental – Women's XL": "WXL",
  "Rental - Women's XXL": "WXXL",
  
  // Men's sizes
  "Rental – Men's Small": "MS",
  "Rental – Men's Medium": "MM",
  "Rental – Men's Large": "ML",
  "Rental – Men's XL": "MXL",
  "Rental – Men's XXL": "MXXL",
  "Rental – Men's XXXL": "M3XL"
};

const FINS_MAPPINGS: Record<string, string> = {
  "I have my Own Fins": "Own",
  "I need XS/S Fins": "XS/S",
  "I need M/L Fins": "M/L",
  "I need XL Fins": "XL",
  "Rental – XXS": "XXS",
  "Rental – XS/S": "XS/S",
  "Rental – M/L": "M/L",
  "Rental – XL": "XL",
  "Rental – XXL": "XXL"
};

const MASK_MAPPINGS: Record<string, string> = {
  "I have my own Mask": "Own",
  "I need a rental Mask": "NEED",
  "Rental – Mask": "NEED"
};

const COMPUTER_MAPPINGS: Record<string, string> = {
  "I have my own Dive Computer": "Own",
  "I need a rental Dive Computer": "NEED",
  "Rental – Dive Computer": "NEED"
};

/**
 * Parse equipment data using precise key-value mappings
 */
export function parseEquipmentItem(
  equipmentType: string,
  csvValue: string
): EquipmentItem {
  // Handle empty values
  if (!csvValue || csvValue.trim() === '') {
    return {
      needed: false,
      abbreviation: 'NONE'
    };
  }

  const cleanValue = csvValue.trim();
  let mapping: Record<string, string>;
  
  // Select the appropriate mapping based on equipment type
  switch (equipmentType.toLowerCase()) {
    case 'bcd':
      mapping = BCD_MAPPINGS;
      break;
    case 'regulator':
      mapping = REGULATOR_MAPPINGS;
      break;
    case 'wetsuit':
      mapping = WETSUIT_MAPPINGS;
      break;
    case 'fins':
      mapping = FINS_MAPPINGS;
      break;
    case 'mask':
      mapping = MASK_MAPPINGS;
      break;
    case 'computer':
      mapping = COMPUTER_MAPPINGS;
      break;
    default:
      mapping = {};
  }
  
  // Look up exact match in mapping
  const standardizedValue = mapping[cleanValue];
  
  if (standardizedValue) {
    if (standardizedValue === 'Own') {
      return {
        needed: false,
        abbreviation: 'OWN'
      };
    } else if (standardizedValue === 'NEED') {
      return {
        needed: true,
        abbreviation: `${equipmentType.toUpperCase()}-NEED`
      };
    } else {
      // Size-specific rental
      return {
        needed: true,
        size: standardizedValue,
        abbreviation: `${equipmentType.toUpperCase()}-${standardizedValue}`
      };
    }
  }
  
  // Fallback for unmapped values
  console.warn(`Unmapped equipment value for ${equipmentType}: "${cleanValue}"`);
  return {
    needed: true,
    abbreviation: `${equipmentType.toUpperCase()}-UNKNOWN`
  };
}

/**
 * Parse all equipment needs from Checkfront CSV row
 */
export function parseEquipmentNeeds(csvRow: any): EquipmentNeeds {
  return {
    bcd: parseEquipmentItem('BCD', csvRow.BCD || ''),
    regulator: parseEquipmentItem('REG', csvRow.Regulator || ''),
    mask: parseEquipmentItem('MASK', csvRow.Mask || ''),
    fins: parseEquipmentItem('FINS', csvRow.Fins || ''),
    wetsuit: parseEquipmentItem('WET', csvRow['Wetsuit (not mandatory)'] || ''),
    computer: parseEquipmentItem('COMP', csvRow['Dive Computer (Required)'] || ''),
  };
}

/**
 * Generate equipment summary for manifest display
 * Returns something like: "BCD-M/L, REG-M/L, OWN, OWN, WET-M/L, COMP-M/L"
 */
export function generateEquipmentSummary(equipment: EquipmentNeeds): string {
  const items = [
    equipment.bcd.abbreviation,
    equipment.regulator.abbreviation,
    equipment.mask.abbreviation,
    equipment.fins.abbreviation,
    equipment.wetsuit.abbreviation,
    equipment.computer?.abbreviation
  ].filter(Boolean);
  
  return items.join(', ');
}

/**
 * Count total rental items needed
 */
export function countRentalItems(equipment: EquipmentNeeds): number {
  const items = [
    equipment.bcd,
    equipment.regulator,
    equipment.mask,
    equipment.fins,
    equipment.wetsuit,
    equipment.computer
  ].filter((item): item is EquipmentItem => item !== undefined);
  
  return items.filter(item => item.needed).length;
}

/**
 * Check if customer needs any rental equipment
 */
export function needsRentalEquipment(equipment: EquipmentNeeds): boolean {
  return countRentalItems(equipment) > 0;
}

/**
 * Parse nitrox certification from Checkfront data
 */
export function parseNitroxCertified(csvRow: any): boolean {
  const nitroxColumn = csvRow['Diving Nitrox (at additional cost)'] || '';
  const nitroxCertColumn = csvRow['Nitrox Certification Agency and Number'] || '';
  
  // Check if they have nitrox certification
  return nitroxCertColumn.trim() !== '' && nitroxCertColumn !== '-';
}

/**
 * Parse certification level from Checkfront data
 */
export function parseCertificationLevel(csvRow: any): string {
  const level = csvRow['Certification Level'] || '';
  return level.trim() || 'Unknown';
}

/**
 * Parse special requirements from Checkfront data
 */
export function parseSpecialRequirements(csvRow: any): string {
  const requirements = csvRow['Is there anything else you would like for us to know?'] || '';
  return requirements.trim() || '';
}

/**
 * Parse Checkfront CSV data into Customer objects
 * Maps actual Checkfront CSV columns to Customer interface fields
 * Only includes documents with "completed" status
 */
export function parseCheckfrontCSV(csvData: any[]): Customer[] {
  console.log('Parsing Checkfront CSV with', csvData.length, 'rows');
  
  if (csvData.length > 0) {
    console.log('Available CSV columns:', Object.keys(csvData[0]));
  }

  return csvData.map((row, index) => {
    try {
      console.log(`Processing row ${index + 1}:`, row);

      // First filter: Only process completed documents
      const status = row.Status || '';
      if (status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'complete') {
        console.log(`Skipping row ${index + 1} - Status: "${status}" (not completed/complete)`);
        return null;
      }

      // Map actual Checkfront columns to Customer fields with normalization
      const customerData = {
        id: `import-${Date.now()}-${index}`, // Generate unique ID
        bookingReference: getFirstValue(row, ['Booking', 'booking_id', 'Booking ID']),
        documentId: getFirstValue(row, ['Document', 'document_id', 'Document ID']),
        fullName: normalizeName(getFirstValue(row, ['Name', 'Full Name', 'Participants Name', 'Participant Name'])),
        age: getFirstValue(row, ['Age']),
        email: normalizeEmail(getFirstValue(row, ['Email', 'Primary Email', 'Email Address'])),
        phone: normalizePhone(getFirstValue(row, ['Phone Number', 'Phone'])),
        accommodations: getFirstValue(row, ['Accomodations', 'Accommodations', 'Accommodation Details']),
        certificationLevel: getFirstValue(row, ['Certification Level']) || 'Unknown',
        certificationAgency: getFirstValue(row, ['Certification Agency and Number']),
        nitroxCertified: parseNitroxCertified(row),
        equipmentNeeded: parseEquipmentNeeds(row),
        specialRequirements: getFirstValue(row, [
          'Is there anything else you would like for us to know?',
          'Are you a comfortable swimmer? Anything else we need to know?',
        ]),
        lastDiveDate: getFirstValue(row, ['Date of Last Dive']),
        totalDives: getFirstValue(row, ['Number of Dives in your Lifetime']),
        createdAt: new Date(),
        updatedAt: new Date(),
        csvCreatedDate: getFirstValue(row, ['Created Date', 'Created']),
      };

      const customer: Customer = {
        ...customerData,
        createdAt: customerData.csvCreatedDate ? new Date(customerData.csvCreatedDate) : new Date(),
      };

      console.log(`Parsed customer ${index + 1}:`, {
        bookingReference: customer.bookingReference,
        documentId: customer.documentId,
        fullName: customer.fullName,
        email: customer.email,
        accommodations: customer.accommodations,
        certificationLevel: customer.certificationLevel,
        nitroxCertified: customer.nitroxCertified,
        equipmentCount: countRentalItems(customer.equipmentNeeded)
      });

      return customer;
    } catch (error) {
      console.error(`Error parsing row ${index + 1}:`, error);
      throw new Error(`Failed to parse row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }).filter((customer): customer is Customer => {
    // Type guard: ensure customer is not null
    return customer !== null;
  }).filter(customer => {
    // Filter out rows with missing essential data
    const isValid = customer.bookingReference && customer.fullName;
    console.log(`Filtering customer - Valid: ${isValid}, BookingRef: "${customer.bookingReference}", FullName: "${customer.fullName}"`);
    if (!isValid) {
      console.warn('Filtered out invalid customer:', customer);
    }
    return isValid;
  });
}

/**
 * Create equipment needs for manual entry (when no CSV data available)
 */
export function createDefaultEquipmentNeeds(): EquipmentNeeds {
  return {
    bcd: { needed: false, abbreviation: 'NONE' },
    regulator: { needed: false, abbreviation: 'NONE' },
    mask: { needed: false, abbreviation: 'NONE' },
    fins: { needed: false, abbreviation: 'NONE' },
    wetsuit: { needed: false, abbreviation: 'NONE' },
    computer: { needed: false, abbreviation: 'NONE' }
  };
}
