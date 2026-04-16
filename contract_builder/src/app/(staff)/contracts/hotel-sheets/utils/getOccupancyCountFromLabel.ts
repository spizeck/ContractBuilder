/**
 * Converts a common occupancy label into a person count.
 * Case-insensitive. Falls back to 1 if the label is unrecognised.
 *
 * Extend the map below if new occupancy labels are introduced.
 */
export function getOccupancyCountFromLabel(occupancyType: string): number {
  const normalised = occupancyType.trim().toLowerCase()

  const knownLabels: Record<string, number> = {
    single: 1,
    double: 2,
    twin: 2,
    triple: 3,
    quad: 4,
    quadruple: 4,
  }

  const match = knownLabels[normalised]
  if (match !== undefined) return match

  // If the label could not be parsed, fall back to 1.
  // TODO: extend knownLabels if additional occupancy types are added to the data model.
  return 1
}
