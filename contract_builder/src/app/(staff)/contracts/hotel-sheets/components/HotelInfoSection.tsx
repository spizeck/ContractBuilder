import { Box, Grid, Heading, Text } from '@chakra-ui/react'
import { Hotel, HotelSheetOptions } from '../../_types'

interface HotelInfoSectionProps {
  hotel: Hotel
  options: HotelSheetOptions
}

/** Maps each option key → hotel field key + display label, in render order. */
const LEFT_COLUMN_FIELDS: Array<{
  optionKey: keyof HotelSheetOptions
  hotelKey: keyof Hotel
  label: string
}> = []

const RIGHT_COLUMN_FIELDS: Array<{
  optionKey: keyof HotelSheetOptions
  hotelKey: keyof Hotel
  label: string
}> = [
  { optionKey: 'includeAmenities',          hotelKey: 'amenities',         label: 'Amenities'         },
  { optionKey: 'includePolicies',           hotelKey: 'policies',          label: 'Hotel Policies'    },
  { optionKey: 'includeRestrictions',       hotelKey: 'restrictions',      label: 'Restrictions'      },
  { optionKey: 'includeOperationalNotes',   hotelKey: 'operationalNotes',  label: 'Operational Notes' },
  { optionKey: 'includeCancellationPolicy', hotelKey: 'cancellationPolicy',label: 'Cancellation Policy'},
  { optionKey: 'includePaymentTerms',       hotelKey: 'paymentTerms',      label: 'Payment Terms'     },
  { optionKey: 'includeForceMajeure',       hotelKey: 'forceMajeure',      label: 'Force Majeure'     },
  { optionKey: 'includeTravelInsurance',    hotelKey: 'travelInsurance',   label: 'Travel Insurance'  },
  { optionKey: 'includeFitnessToDive',      hotelKey: 'fitnessToDive',     label: 'Fitness to Dive'   },
  { optionKey: 'includeUnusedServices',     hotelKey: 'unusedServices',    label: 'Unused Services'   },
]

const ALL_FIELDS = [...LEFT_COLUMN_FIELDS, ...RIGHT_COLUMN_FIELDS]

/** A single labelled content block within the hotel overview */
function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box mb={5}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        letterSpacing="widest"
        textTransform="uppercase"
        color="textMuted"
        mb={1}
        paddingBottom={1}
        borderBottom="1px solid"
        borderColor="gray.300"
      >
        {label}
      </Text>
      <Text fontSize="sm" color="textSecondary" whiteSpace="pre-wrap" lineHeight="tall">
        {value}
      </Text>
    </Box>
  )
}

export default function HotelInfoSection({ hotel, options }: HotelInfoSectionProps) {
  const hasAnyContent = ALL_FIELDS.some(
    ({ optionKey, hotelKey }) => options[optionKey] && !!hotel[hotelKey]
  )

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

      {/* Single column layout */}
      <Box>
        {ALL_FIELDS.map(({ optionKey, hotelKey, label }) => {
          const value = hotel[hotelKey]
          if (!options[optionKey] || !value) return null
          return <InfoBlock key={optionKey} label={label} value={value as string} />
        })}
      </Box>
    </Box>
  )
}
