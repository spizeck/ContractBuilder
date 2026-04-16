import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { MealPackage } from '../../_types'
import { formatCurrency } from '@shared/utils/formatters'

interface MealPackagesSectionProps {
  mealPackages: MealPackage[]
  showCommissionInfo: boolean
}

export default function MealPackagesSection({
  mealPackages,
  showCommissionInfo,
}: MealPackagesSectionProps) {
  if (mealPackages.length === 0) return null

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
        Meal Packages
      </Heading>

      <VStack align="stretch" spacing={3}>
        {mealPackages.map(pkg => (
          <Box
            key={pkg.id}
            className="package-card"
            pl={4}
            py={3}
            borderLeftWidth="3px"
            borderLeftColor="teal.400"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <Text fontWeight="semibold" fontSize="sm" color="gray.800">
              {pkg.name}
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="teal.600" mt={0.5}>
              ${formatCurrency(pkg.price)}{' '}
              <Text as="span" fontWeight="normal" color="gray.500" fontSize="xs">
                per person
              </Text>
            </Text>
            {pkg.description && (
              <Text fontSize="xs" color="gray.500" mt={1.5} whiteSpace="pre-wrap" lineHeight="tall">
                {pkg.description}
              </Text>
            )}
            {/* Only visible when internal commission mode is enabled */}
            {showCommissionInfo && typeof pkg.commissionRate === 'number' && (
              <Text fontSize="xs" color="gray.400" mt={1.5} fontStyle="italic">
                Commission: {(pkg.commissionRate * 100).toFixed(0)}%
              </Text>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
