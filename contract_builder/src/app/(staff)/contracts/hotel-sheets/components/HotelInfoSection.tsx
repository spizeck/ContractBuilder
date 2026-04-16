import { Box, Grid, Heading, Text } from '@chakra-ui/react'
import { Hotel, HotelSheetOptions } from '../../_types'

interface HotelInfoSectionProps {
  hotel: Hotel
  options: HotelSheetOptions
}

/** A single labelled content block within the hotel overview */
function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box mb={5} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <Text
        fontSize="10px"
        fontWeight="semibold"
        letterSpacing="widest"
        textTransform="uppercase"
        color="gray.400"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="tall">
        {value}
      </Text>
    </Box>
  )
}

export default function HotelInfoSection({ hotel, options }: HotelInfoSectionProps) {
  const hasAnyContent =
    (options.includeDescription && !!hotel.description) ||
    (options.includeContactInfo && !!hotel.contactInfo) ||
    (options.includeAmenities && !!hotel.amenities) ||
    (options.includePolicies && !!hotel.policies) ||
    (options.includeRestrictions && !!hotel.restrictions)

  if (!hasAnyContent) return null

  return (
    <Box className="sheet-section" mb={2}>
      <Heading
        as="h2"
        fontSize="xs"
        fontWeight="semibold"
        letterSpacing="widest"
        textTransform="uppercase"
        color="teal.600"
        mb={5}
      >
        Hotel Overview
      </Heading>

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        {/* Left column */}
        <Box>
          {options.includeDescription && hotel.description && (
            <InfoBlock label="Description" value={hotel.description} />
          )}
          {options.includeContactInfo && hotel.contactInfo && (
            <InfoBlock label="Contact Information" value={hotel.contactInfo} />
          )}
        </Box>

        {/* Right column */}
        <Box>
          {options.includeAmenities && hotel.amenities && (
            <InfoBlock label="Amenities" value={hotel.amenities} />
          )}
          {options.includePolicies && hotel.policies && (
            <InfoBlock label="Hotel Policies" value={hotel.policies} />
          )}
          {options.includeRestrictions && hotel.restrictions && (
            <InfoBlock label="Restrictions" value={hotel.restrictions} />
          )}
        </Box>
      </Grid>
    </Box>
  )
}
