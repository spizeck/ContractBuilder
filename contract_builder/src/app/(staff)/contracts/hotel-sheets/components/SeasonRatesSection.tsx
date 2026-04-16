import {
  Box,
  Divider,
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import { HotelSheetSeasonRates } from '../../_types'
import { formatCurrency, formatDateRange } from '@shared/utils/formatters'

interface SeasonRatesSectionProps {
  seasons: HotelSheetSeasonRates[]
}

export default function SeasonRatesSection({ seasons }: SeasonRatesSectionProps) {
  if (seasons.length === 0) return null

  return (
    <Box className="sheet-section" mb={6}>
      <Heading as="h3" size="md" mb={4}>
        Room Rates by Season
      </Heading>
      <Divider mb={4} />

      <VStack align="stretch" spacing={6}>
        {seasons.map(season => (
          <Box
            key={season.seasonId}
            className="season-block"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            {/* Season header */}
            <Box mb={2}>
              <Text fontWeight="bold" fontSize="md">
                {season.seasonName}
              </Text>
              <Text fontSize="sm" color="textMuted">
                {formatDateRange(season.startDate, season.endDate)}
              </Text>
            </Box>

            {season.rates.length === 0 ? (
              <Text fontSize="sm" color="warning" fontStyle="italic">
                No room rates found for this season.
              </Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Room Category</Th>
                    <Th>Occupancy</Th>
                    <Th isNumeric>Price (USD)</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {season.rates.map((rate, i) => (
                    <Tr key={`${rate.categoryId}-${rate.occupancyType}-${i}`}>
                      <Td>{rate.categoryName}</Td>
                      <Td>{rate.occupancyType}</Td>
                      <Td isNumeric>${formatCurrency(rate.price)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
