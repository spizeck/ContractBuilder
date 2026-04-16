import { Box, Heading, Text } from '@chakra-ui/react'
import { HotelSheetRoomInventoryRow } from '../../_types'

interface RoomInventorySectionProps {
  roomInventory: HotelSheetRoomInventoryRow[]
}

export default function RoomInventorySection({ roomInventory }: RoomInventorySectionProps) {
  if (roomInventory.length === 0) return null

  // Group rows by category name for a cleaner read
  const grouped = new Map<string, HotelSheetRoomInventoryRow[]>()
  for (const row of roomInventory) {
    const existing = grouped.get(row.roomCategoryName) ?? []
    existing.push(row)
    grouped.set(row.roomCategoryName, existing)
  }
  const categoryNames = Array.from(grouped.keys()).sort()

  return (
    <Box className="sheet-section">
      <Heading
        as="h2"
        fontSize="xs"
        fontWeight="semibold"
        letterSpacing="widest"
        textTransform="uppercase"
        color="teal.600"
        mb={5}
      >
        Room Types Available
      </Heading>

      {/* 2-column grid; each category stays together for print */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(2, 1fr)"
        gap={6}
        style={{ columnGap: '40px' }}
      >
        {categoryNames.map(categoryName => (
          <Box
            key={categoryName}
            className="category-group"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            {/* Category heading */}
            <Text
              fontSize="11px"
              fontWeight="700"
              color="textMuted"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
              pb={1.5}
              borderBottomWidth="1px"
              borderBottomColor="border"
            >
              {categoryName}
            </Text>

            {/* Room type entries */}
            {(grouped.get(categoryName) ?? []).map(row => (
              <Box key={row.roomTypeId} mb={3.5}>
                <Text fontSize="sm" fontWeight="600" color="textPrimary" lineHeight="snug">
                  {row.roomTypeName}
                </Text>
                <Text fontSize="xs" color="textMuted" mt={0.5} lineHeight="snug">
                  {Number(row.quantity)} {Number(row.quantity) === 1 ? 'unit' : 'units'}
                </Text>
                {row.description && (
                  <Text fontSize="xs" color="textMuted" mt={0.5} lineHeight="short" fontStyle="italic">
                    {row.description}
                  </Text>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
