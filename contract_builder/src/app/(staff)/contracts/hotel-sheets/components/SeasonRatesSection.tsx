import type { CSSProperties } from 'react'
import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { HotelSheetSeasonRates } from '../../_types'
import { formatCurrency, formatDateRange } from '@shared/utils/formatters'

interface SeasonRatesSectionProps {
  seasons: HotelSheetSeasonRates[]
  numNights: number
}

export default function SeasonRatesSection({ seasons, numNights }: SeasonRatesSectionProps) {
  if (seasons.length === 0) return null

  return (
    <Box className="sheet-section">
      {/* Section heading */}
      <Heading
        as="h2"
        fontSize="xs"
        fontWeight="semibold"
        letterSpacing="widest"
        textTransform="uppercase"
        color="teal.600"
        mb={1}
      >
        Room Rates by Season
      </Heading>
      <Text fontSize="xs" color="textMuted" fontStyle="italic" mb={6}>
        Rates shown per person, based on a {numNights}-night stay.
      </Text>

      <VStack align="stretch" spacing={10}>
        {seasons.map(season => (
          <Box
            key={season.seasonId}
            className="season-block"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            {/* Season name + date range */}
            <Box mb={4} pb={2} borderBottomWidth="2px" borderBottomColor="border">
              <Text fontWeight="700" fontSize="md" color="textPrimary" letterSpacing="tight">
                {season.seasonName}
              </Text>
              <Text fontSize="xs" color="textMuted" mt={0.5}>
                {formatDateRange(season.startDate, season.endDate)}
              </Text>
            </Box>

            {season.categoryRates.length === 0 ? (
              <Text fontSize="sm" color="warning" fontStyle="italic">
                No room pricing found for this season.
              </Text>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={thLeft}>Category</th>
                    <th style={thLeft}>Occupancy</th>
                    <th style={thRight}>Nightly Rate</th>
                    <th style={{ ...thRight, color: '#2b6cb0', fontWeight: 700 }}>
                      {numNights}-Night / Person
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {season.categoryRates.map((row, i) => (
                    <tr
                      key={`${row.roomCategoryId}-${row.occupancyType}-${i}`}
                      style={{ borderBottom: '1px solid #edf2f7' }}
                    >
                      <td style={tdLeft}>{row.roomCategoryName}</td>
                      <td style={tdLeft}>{row.occupancyType}</td>
                      <td style={tdRight}>${formatCurrency(row.nightlyRate)}</td>
                      <td style={{ ...tdRight, fontWeight: 600, color: '#2b6cb0' }}>
                        ${formatCurrency(row.nightsPerPerson)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

const thLeft: CSSProperties = {
  textAlign: 'left',
  padding: '7px 12px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#718096',
  borderBottom: '1px solid #e2e8f0',
}

const thRight: CSSProperties = {
  ...thLeft,
  textAlign: 'right',
}

const tdLeft: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  color: '#2d3748',
}

const tdRight: CSSProperties = {
  ...tdLeft,
  textAlign: 'right',
}
