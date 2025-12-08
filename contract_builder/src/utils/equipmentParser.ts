import { EquipmentNeeds, EquipmentItem } from '@/types/manifestTypes';

/**
 * Parse equipment data from Checkfront CSV format
 * Examples:
 * - "Rental – M/L" → { needed: true, size: "M/L", abbreviation: "BCD-M/L" }
 * - "I have my own Wetsuit" → { needed: false, abbreviation: "OWN" }
 * - "" (empty) → { needed: false, abbreviation: "NONE" }
 */
export function parseEquipmentItem(
  equipmentType: string,
  csvValue: string
): EquipmentItem {
  const cleanValue = csvValue.trim();
  
  // Empty value - no equipment needed
  if (!cleanValue || cleanValue === '-') {
    return {
      needed: false,
      abbreviation: 'NONE'
    };
  }
  
  // Own equipment
  if (cleanValue.toLowerCase().includes('own') || 
      cleanValue.toLowerCase().includes('have my own')) {
    return {
      needed: false,
      abbreviation: 'OWN'
    };
  }
  
  // Rental equipment - extract size
  const sizeMatch = cleanValue.match(/Rental\s*–\s*([A-Z0-9\/\-]+)/i);
  if (sizeMatch) {
    const size = sizeMatch[1].trim();
    const abbreviation = `${equipmentType.toUpperCase()}-${size}`;
    return {
      needed: true,
      size,
      abbreviation
    };
  }
  
  // Fallback - assume rental if not empty
  return {
    needed: true,
    abbreviation: equipmentType.toUpperCase()
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
