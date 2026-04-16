import { Box, Divider, Heading, Text, VStack } from '@chakra-ui/react'
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
    <Box className="sheet-section" mb={6}>
      <Heading as="h3" size="md" mb={4}>
        Meal Packages
      </Heading>
      <Divider mb={4} />

      <VStack align="stretch" spacing={4}>
        {mealPackages.map(pkg => (
          <Box
            key={pkg.id}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            className="package-card"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <Text fontWeight="bold" fontSize="md">
              {pkg.name}
            </Text>
            <Text fontWeight="semibold" color="teal.500" fontSize="sm" mt={0.5}>
              ${formatCurrency(pkg.price)} per person
            </Text>
            {pkg.description && (
              <Text fontSize="sm" color="textSecondary" mt={2} whiteSpace="pre-wrap">
                {pkg.description}
              </Text>
            )}
            {/* Only visible when internal commission mode is enabled */}
            {showCommissionInfo && typeof pkg.commissionRate === 'number' && (
              <Text fontSize="xs" color="textMuted" mt={2} fontStyle="italic">
                Commission: {(pkg.commissionRate * 100).toFixed(0)}%
              </Text>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
