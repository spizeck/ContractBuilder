import { Box, Divider, Heading, Image, Text, VStack } from '@chakra-ui/react'
import { Hotel, HotelSheetOptions } from '../../_types'

interface HotelInfoSectionProps {
  hotel: Hotel
  options: HotelSheetOptions
}

export default function HotelInfoSection({ hotel, options }: HotelInfoSectionProps) {
  return (
    <Box className="sheet-section hotel-info-section" mb={6}>
      {/* Logo */}
      {options.includeLogo && hotel.logoUrl && (
        <Box mb={4}>
          <Image
            src={hotel.logoUrl}
            alt={`${hotel.name} logo`}
            maxH="80px"
            objectFit="contain"
          />
        </Box>
      )}

      <Heading as="h2" size="lg" mb={1}>
        {hotel.name}
      </Heading>

      {hotel.location && (
        <Text fontSize="md" color="textMuted" mb={3}>
          {hotel.location}
        </Text>
      )}

      <Divider mb={3} />

      <VStack align="stretch" spacing={3}>
        {options.includeDescription && hotel.description && (
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textMuted" mb={1}>
              Description
            </Text>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {hotel.description}
            </Text>
          </Box>
        )}

        {options.includeContactInfo && hotel.contactInfo && (
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textMuted" mb={1}>
              Contact Information
            </Text>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {hotel.contactInfo}
            </Text>
          </Box>
        )}

        {options.includeAmenities && hotel.amenities && (
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textMuted" mb={1}>
              Amenities
            </Text>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {hotel.amenities}
            </Text>
          </Box>
        )}

        {options.includePolicies && hotel.policies && (
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textMuted" mb={1}>
              Hotel Policies
            </Text>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {hotel.policies}
            </Text>
          </Box>
        )}

        {options.includeRestrictions && hotel.restrictions && (
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textMuted" mb={1}>
              Restrictions
            </Text>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {hotel.restrictions}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
