import { Box, Button, Divider, Flex, Heading, Text } from '@chakra-ui/react'
import { HotelSheetViewModel } from '../../_types'
import HotelInfoSection from './HotelInfoSection'
import RoomInventorySection from './RoomInventorySection'
import SeasonRatesSection from './SeasonRatesSection'
import DivePackagesSection from './DivePackagesSection'
import MealPackagesSection from './MealPackagesSection'

interface HotelSheetPreviewProps {
  viewModel: HotelSheetViewModel | null
  isReady: boolean
}

export default function HotelSheetPreview({ viewModel, isReady }: HotelSheetPreviewProps) {
  const handlePrint = () => window.print()

  // Empty state
  if (!isReady || !viewModel || !viewModel.hotel) {
    return (
      <Box
        p={8}
        borderWidth="1px"
        borderRadius="md"
        borderStyle="dashed"
        textAlign="center"
        color="textMuted"
        minH="400px"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="lg" mb={2}>No preview available</Text>
        <Text fontSize="sm">Select a hotel and at least one season to see the sheet preview.</Text>
      </Box>
    )
  }

  const { hotel, roomInventory, seasons, divePackages, mealPackages, generatedAt, options } = viewModel
  const hasAnyRates = seasons.some(s => s.categoryRates.length > 0)

  // At-a-glance computed values
  const totalRooms = roomInventory.reduce((sum, r) => sum + Number(r.quantity), 0)
  const uniqueCategories = new Set(roomInventory.map(r => r.roomCategoryId)).size

  // Compact page-1 description — gated on the same flag as the full description
  const shortDescription = options.includeDescription && hotel.description
    ? hotel.description.length > 300
      ? hotel.description.slice(0, 300).trimEnd() + '…'
      : hotel.description
    : null

  return (
    <Box>
      {/* ── On-screen controls (hidden when printing) ── */}
      <Box mb={4} className="no-print">
        <Flex align="center" gap={4} flexWrap="wrap">
          <Button colorScheme="teal" onClick={handlePrint} size="sm">
            Print / Save PDF
          </Button>
          <Text fontSize="xs" color="textMuted" fontStyle="italic">
            Tip: In the print dialog, disable &ldquo;Headers and footers&rdquo; for a cleaner PDF.
          </Text>
        </Flex>
      </Box>

      {/* ─── Printable document ─── */}
      <Box
        id="hotel-sheet-print-area"
        bg="white"
        color="gray.800"
        maxW="820px"
        mx="auto"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        lineHeight="tall"
        fontSize="sm"
        overflow="hidden"
      >
        {/* Shared inner content wrapper — same padding on every page */}
        <div className="doc-content" style={{ padding: '32px 28px' }}>

        {/* ══ PAGE 1: Co-branded header + summary ══ */}

        {/* Co-branded document header */}
        <Flex
          align="center"
          justify="space-between"
          mb={6}
          pb={5}
          borderBottomWidth="2px"
          borderBottomColor="teal.500"
          className="sheet-header"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {/* Left: Sea Saba brand logo */}
          <Box flexShrink={0}>
            <img
              src="/SS_blue.svg"
              alt="Sea Saba"
              style={{ width: '140px', height: 'auto', display: 'block' }}
            />
          </Box>

          {/* Centre: document label + hotel identity */}
          <Box flex={1} textAlign="center" px={6}>
            <Text
              fontSize="10px"
              fontWeight="semibold"
              letterSpacing="widest"
              color="gray.400"
              textTransform="uppercase"
              mb={1}
            >
              Hotel Price &amp; Information Sheet
            </Text>
            <Heading
              as="h1"
              fontSize="2xl"
              fontWeight="bold"
              color="gray.800"
              lineHeight="short"
              mb={0.5}
            >
              {hotel.name}
            </Heading>
            {hotel.location && (
              <Text fontSize="sm" color="textMuted" mb={1}>
                {hotel.location}
              </Text>
            )}
            <Text fontSize="10px" color="textMuted">
              Generated {generatedAt} - Published Rates
            </Text>
          </Box>

          {/* Right: Hotel logo (if available); invisible placeholder keeps centre centred */}
          <Box flexShrink={0} style={{ width: '140px', textAlign: 'right' }}>
            {options.includeLogo && hotel.logoUrl && (
              <img
                src={hotel.logoUrl}
                alt={hotel.name}
                style={{ maxWidth: '120px', maxHeight: '70px', objectFit: 'contain', display: 'inline-block' }}
              />
            )}
          </Box>
        </Flex>

        {/* At a Glance — plain table layout, avoids SimpleGrid digit-splitting bug */}
        <Box
          mb={8}
          p={5}
          borderWidth="1px"
          borderColor="gray.100"
          borderRadius="md"
          bg="gray.50"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <Text
            fontSize="10px"
            fontWeight="700"
            letterSpacing="widest"
            textTransform="uppercase"
            color="textMuted"
            mb={4}
          >
            At a Glance
          </Text>
          {/* Use a plain inline-flex row so numbers never split across columns */}
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #e2e8f0' }}>
            {[
              { label: 'Room Types', value: roomInventory.length },
              { label: 'Total Units', value: totalRooms },
              { label: 'Categories', value: uniqueCategories },
              { label: 'Seasons', value: seasons.length },
              { label: 'Dive Packages', value: divePackages.length },
              { label: 'Meal Packages', value: mealPackages.length },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  flex: '1',
                  textAlign: 'center',
                  padding: '14px 8px 12px',
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#2c7a7b', lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '5px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Box>

        {/* Page 1 compact hotel intro */}
        {(shortDescription || (options.includeContactInfo && hotel.contactInfo) || (options.includeAmenities && hotel.amenities)) && (
          <Box
            mb={6}
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <Text
              fontSize="10px"
              fontWeight="700"
              letterSpacing="widest"
              textTransform="uppercase"
              color="teal.600"
              mb={4}
            >
              About This Hotel
            </Text>

            {options.includeDescription && hotel.description && (
              <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="tall" mb={4}>
                {hotel.description}
              </Text>
            )}

            <div style={{ display: 'flex', gap: '32px' }}>
              {options.includeContactInfo && hotel.contactInfo && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#a0aec0', marginBottom: '4px' }}>
                    Contact
                  </div>
                  <div style={{ fontSize: '13px', color: '#4a5568', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {hotel.contactInfo}
                  </div>
                </div>
              )}
              {options.includeAmenities && hotel.amenities && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#a0aec0', marginBottom: '4px' }}>
                    Highlights
                  </div>
                  <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.6 }}>
                    {/* Show first 5 amenity items if comma-separated, else first 200 chars */}
                    {hotel.amenities.includes(',')
                      ? hotel.amenities.split(',').slice(0, 5).map(a => a.trim()).join(' · ')
                      : hotel.amenities.length > 200
                        ? hotel.amenities.slice(0, 200).trimEnd() + '…'
                        : hotel.amenities}
                  </div>
                </div>
              )}
            </div>
          </Box>
        )}

        {/* ══ PAGE 2+: Full hotel overview + room inventory ══ */}
        <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />

        {/* Full hotel overview */}
        <HotelInfoSection hotel={hotel} options={options} />

        {/* Room inventory */}
        {roomInventory.length > 0 && (
          <>
            <SheetDivider />
            <RoomInventorySection roomInventory={roomInventory} />
          </>
        )}

        {/* ══ Seasonal room rates ══ */}
        <SheetDivider />
        {seasons.length === 0 ? (
          <Text color="warning" fontStyle="italic" fontSize="sm" mb={6}>
            No seasons selected. Select one or more seasons to display room rates.
          </Text>
        ) : (
          <>
            {!hasAnyRates && (
              <Text color="warning" fontStyle="italic" fontSize="sm" mb={4}>
                Warning: No room rates found for the selected seasons.
              </Text>
            )}
            <SeasonRatesSection seasons={seasons} numNights={options.numNights} />
          </>
        )}

        {/* ══ Dive packages — start on a fresh page with meal packages ══ */}
        {divePackages.length > 0 && (
          <>
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />
            <DivePackagesSection divePackages={divePackages} />
          </>
        )}

        {/* ══ Meal packages ══ */}
        {mealPackages.length > 0 && (
          <>
            <SheetDivider />
            <MealPackagesSection
              mealPackages={mealPackages}
              showCommissionInfo={options.includeMealCommissionInfo}
            />
          </>
        )}

        {/* ══ Document footer ══ */}
        <Box
          mt={12}
          pt={4}
          borderTopWidth="1px"
          borderTopColor="gray.200"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize="xs" color="textMuted" fontWeight="semibold">
            Sea Saba
          </Text>
          <Text fontSize="xs" color="textMuted">
            {hotel.name} &mdash; Reference Sheet
          </Text>
        </Box>

        </div>{/* /doc-content */}
      </Box>

      {/* ─── Print CSS ─── */}
      <style>{`
        @media print {
          /* Hide app chrome — not body>* which would hide the nested print area */
          header, nav, footer, aside, .no-print {
            display: none !important;
          }

          /* Use @page to set uniform margins on every page including page 2+ */
          @page {
            margin: 14mm 16mm;
          }

          /* Outer container: no decorative chrome, no extra padding */
          #hotel-sheet-print-area {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Inner content wrapper: no padding in print — @page handles all margins */
          .doc-content {
            padding: 0 !important;
          }

          /* Page-break guards */
          .sheet-header   { page-break-inside: avoid; break-inside: avoid; }
          .sheet-section  { page-break-inside: avoid; break-inside: avoid; }
          .season-block   { page-break-inside: avoid; break-inside: avoid; }
          .category-group { page-break-inside: avoid; break-inside: avoid; }
          .package-card   { page-break-inside: avoid; break-inside: avoid; }

          /* Print table sizing */
          table { font-size: 10.5pt; width: 100%; }
          th, td { padding: 5pt 8pt !important; }
        }
      `}</style>
    </Box>
  )
}

/** Consistent section divider */
function SheetDivider() {
  return <Divider my={8} borderColor="gray.200" />
}
