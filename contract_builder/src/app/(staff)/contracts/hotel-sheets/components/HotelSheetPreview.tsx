import { Box, Button, Divider, Heading, Text, VStack } from '@chakra-ui/react'
import { HotelSheetViewModel } from '../../_types'
import HotelInfoSection from './HotelInfoSection'
import SeasonRatesSection from './SeasonRatesSection'
import DivePackagesSection from './DivePackagesSection'
import MealPackagesSection from './MealPackagesSection'

interface HotelSheetPreviewProps {
  viewModel: HotelSheetViewModel | null
  isReady: boolean
}

export default function HotelSheetPreview({ viewModel, isReady }: HotelSheetPreviewProps) {
  const handlePrint = () => window.print()

  // Empty state: no hotel selected
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

  const { hotel, seasons, divePackages, mealPackages, generatedAt, options } = viewModel

  // Warn if seasons selected but none have rates
  const hasAnyRates = seasons.some(s => s.rates.length > 0)

  return (
    <Box>
      {/* Print button – hidden during actual print via CSS */}
      <Box mb={4} className="no-print">
        <Button colorScheme="teal" onClick={handlePrint} size="sm">
          Print / Save PDF
        </Button>
      </Box>

      {/* ─── Printable sheet content ─── */}
      <Box
        id="hotel-sheet-print-area"
        p={8}
        borderWidth="1px"
        borderRadius="md"
        bg="cardBg"
        color="textPrimary"
        fontSize="sm"
      >
        {/* Sheet header */}
        <VStack align="stretch" spacing={1} mb={6}>
          <Heading as="h1" size="xl" color="teal.500">
            Hotel Price &amp; Information Sheet
          </Heading>
          <Text fontSize="sm" color="textMuted">
            Generated: {generatedAt}
          </Text>
        </VStack>

        <Divider mb={6} />

        {/* 1. Hotel info */}
        <HotelInfoSection hotel={hotel} options={options} />

        <Divider mb={6} />

        {/* 2. Season room rates */}
        {seasons.length === 0 ? (
          <Box mb={6}>
            <Text color="warning" fontStyle="italic" fontSize="sm">
              No seasons selected. Select one or more seasons to display room rates.
            </Text>
          </Box>
        ) : (
          <>
            {!hasAnyRates && (
              <Box mb={4}>
                <Text color="warning" fontStyle="italic" fontSize="sm">
                  Warning: No room rates found for the selected seasons.
                </Text>
              </Box>
            )}
            <SeasonRatesSection seasons={seasons} />
          </>
        )}

        {/* 3. Dive packages */}
        {divePackages.length > 0 && <Divider mb={6} />}
        <DivePackagesSection divePackages={divePackages} />

        {/* 4. Meal packages */}
        {mealPackages.length > 0 && <Divider mb={6} />}
        <MealPackagesSection
          mealPackages={mealPackages}
          showCommissionInfo={options.includeMealCommissionInfo}
        />
      </Box>

      {/* ─── Print CSS ─── */}
      <style>{`
        @media print {
          /* Hide everything except the sheet content */
          body > * { display: none !important; }
          #hotel-sheet-print-area {
            display: block !important;
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 16px !important;
          }
          .no-print { display: none !important; }

          /* Avoid splitting key blocks across pages */
          .sheet-section { page-break-inside: avoid; break-inside: avoid; }
          .season-block  { page-break-inside: avoid; break-inside: avoid; }
          .package-card  { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
    </Box>
  )
}
