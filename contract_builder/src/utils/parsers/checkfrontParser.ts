import { EquipmentNeeds, EquipmentItem, Customer } from '@/types/manifestTypes';
import { normalizeName, normalizeEmail, normalizePhone } from '@/utils/stringUtils';
import { getFirstValue, calculateSimilarity } from './csvHelpers';

// Equipment mapping objects for precise parsing
const BCD_MAPPINGS: Record<string, string> = {
  // Own equipment
  "I have my own BCD": "Own",
  
  // Wing style
  "Rental – One Size (Backplate/Wing Style, Weight-Integrated)": "ONE SIZE",
  
  // Jacket style rentals
  "I need a XXS Rental": "XXS",
  "I need a XS Rental": "XS",
  "I need a Small Rental": "S",
  "I need a Medium Rental": "M",
  "I need a Large Rental": "L",
  "I need a XL Rental": "XL",
  "I need a XXL Rental": "XXL",
  "Rental – XXS (Jacket Style, Weight-Belt)": "XXS",
  "Rental – XS (Jacket Style, Weight-Belt)": "XS",
  "Rental – Small (Jacket Style, Weight-Belt)": "S",
  "Rental – Medium (Jacket Style, Weight-Belt)": "M",
  "Rental – Large (Jacket Style, Weight-Belt)": "L",
  "Rental – XL (Jacket Style, Weight-Belt)": "XL",
  "Rental – XXL (Jacket Style, Weight-Belt)": "XXL",
};

const REGULATOR_MAPPINGS: Record<string, string> = {
  'STANDARD': 'STANDARD',
  'RENTAL – REGULATOR SET': 'STANDARD',
  'I NEED A RENTAL REGULATOR': 'STANDARD',
};

const WETSUIT_MAPPINGS: Record<string, string> = {
  'XS': 'XS',
  'S': 'S',
  'M': 'M',
  'L': 'L',
  'XL': 'XL',
  'XXL': 'XXL',
  'XXXL': 'XXXL',
  '4XL': '4XL',
  '5XL': '5XL',
  'I NEED A XS RENTAL': 'XS',
  'I NEED A SMALL RENTAL': 'S',
  'I NEED A MEDIUM RENTAL': 'M',
  'I NEED A LARGE RENTAL': 'L',
  'I NEED A XL RENTAL': 'XL',
  'I NEED A XXL RENTAL': 'XXL',
  'RENTAL – WOMEN\'S XS': 'W-XS',
  'RENTAL – WOMEN\'S SMALL': 'W-S',
  'RENTAL – WOMEN\'S MEDIUM': 'W-M',
  'RENTAL – WOMEN\'S LARGE': 'W-L',
  'RENTAL – WOMEN\'S XL': 'W-XL',
  'RENTAL - WOMEN\'S XXL': 'W-XXL',
  'RENTAL – MEN\'S SMALL': 'M-S',
  'RENTAL – MEN\'S MEDIUM': 'M-M',
  'RENTAL – MEN\'S LARGE': 'M-L',
  'RENTAL – MEN\'S XL': 'M-XL',
  'RENTAL – MEN\'S XXL': 'M-XXL',
  'RENTAL – MEN\'S XXXL': 'M-XXXL',
};

const FINS_MAPPINGS: Record<string, string> = {
  'XXS': 'XXS',
  'XS/S': 'XS/S',
  'M/L': 'M/L',
  'XL': 'XL',
  'XXL': 'XXL',
  'I NEED XS/S FINS': 'XS/S',
  'I NEED M/L FINS': 'M/L',
  'I NEED XL FINS': 'XL',
  'RENTAL – XXS': 'XXS',
  'RENTAL – XS/S': 'XS/S',
  'RENTAL – M/L': 'M/L',
  'RENTAL – XL': 'XL',
  'RENTAL – XXL': 'XXL',
};

const MASK_MAPPINGS: Record<string, string> = {
  'STANDARD': 'STANDARD',
  'I NEED A RENTAL MASK': 'STANDARD',
  'RENTAL – MASK': 'STANDARD',
};

const COMPUTER_MAPPINGS: Record<string, string> = {
  'STANDARD': 'STANDARD',
  'I NEED A RENTAL DIVE COMPUTER': 'STANDARD',
  'RENTAL – DIVE COMPUTER': 'STANDARD',
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
        accommodations: getFirstValue(row, ['Accommodations', 'Accommodation Details']),
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
        id: customerData.id || `import-${Date.now()}-${index}`,
        fullName: customerData.fullName,
        emailLower: customerData.email?.toLowerCase() || null,
        phoneE164: customerData.phone || null,
        dob: customerData.age || null, // Using age field as placeholder for DOB
        notesGeneral: customerData.specialRequirements || null,
        certLevel: customerData.certificationLevel || null,
        certAgencyNumber: customerData.certificationAgency || null,
        certVerified: false,
        certVerifiedAt: null,
        certVerifiedBy: null,
        nitroxCertified: customerData.nitroxCertified || false,
        nitroxCertAgencyNumber: null,
        nitroxVerified: false,
        nitroxVerifiedAt: null,
        nitroxVerifiedBy: null,
        lastDiveDate: customerData.lastDiveDate || null,
        lifetimeDives: customerData.totalDives ? parseInt(customerData.totalDives) || null : null,
        lastDiveDateSourceAt: null,
        gearDefault: {
          bcd: customerData.equipmentNeeded?.bcd ? {
            needRental: customerData.equipmentNeeded.bcd.needed,
            ...(customerData.equipmentNeeded.bcd.size && { sizeText: customerData.equipmentNeeded.bcd.size }),
            sourceText: customerData.equipmentNeeded.bcd.abbreviation || ''
          } : { needRental: false, sourceText: '' },
          regulator: customerData.equipmentNeeded?.regulator ? {
            needRental: customerData.equipmentNeeded.regulator.needed,
            ...(customerData.equipmentNeeded.regulator.size && { sizeText: customerData.equipmentNeeded.regulator.size }),
            sourceText: customerData.equipmentNeeded.regulator.abbreviation || ''
          } : { needRental: false, sourceText: '' },
          mask: customerData.equipmentNeeded?.mask ? {
            needRental: customerData.equipmentNeeded.mask.needed,
            sourceText: customerData.equipmentNeeded.mask.abbreviation || ''
          } : { needRental: false, sourceText: '' },
          fins: customerData.equipmentNeeded?.fins ? {
            needRental: customerData.equipmentNeeded.fins.needed,
            sourceText: customerData.equipmentNeeded.fins.abbreviation || ''
          } : { needRental: false, sourceText: '' },
          wetsuit: customerData.equipmentNeeded?.wetsuit ? {
            needRental: customerData.equipmentNeeded.wetsuit.needed,
            sourceText: customerData.equipmentNeeded.wetsuit.abbreviation || ''
          } : { needRental: false, sourceText: '' },
          computer: customerData.equipmentNeeded?.computer ? {
            needRental: customerData.equipmentNeeded.computer.needed,
            sourceText: customerData.equipmentNeeded.computer.abbreviation || ''
          } : { needRental: false, sourceText: '' },
        },
        gearLastUpdatedAt: null,
        createdAt: customerData.csvCreatedDate ? new Date(customerData.csvCreatedDate) : new Date(),
        updatedAt: new Date(),
      };

      console.log(`Parsed customer ${index + 1}:`, {
        fullName: customer.fullName,
        email: customer.emailLower,
        certLevel: customer.certLevel,
        nitroxCertified: customer.nitroxCertified,
        equipmentCount: countRentalItems({
          bcd: { needed: customer.gearDefault.bcd?.needRental || false, abbreviation: '' },
          regulator: { needed: customer.gearDefault.regulator?.needRental || false, abbreviation: '' },
          mask: { needed: customer.gearDefault.mask?.needRental || false, abbreviation: '' },
          fins: { needed: customer.gearDefault.fins?.needRental || false, abbreviation: '' },
          wetsuit: { needed: customer.gearDefault.wetsuit?.needRental || false, abbreviation: '' },
          computer: { needed: customer.gearDefault.computer?.needRental || false, abbreviation: '' },
        })
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
    const isValid = customer.fullName;
    console.log(`Filtering customer - Valid: ${isValid}, FullName: "${customer.fullName}"`);
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
