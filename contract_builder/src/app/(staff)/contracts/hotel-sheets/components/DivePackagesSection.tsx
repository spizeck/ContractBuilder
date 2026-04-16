import { Box, Divider, Heading, Text, VStack } from '@chakra-ui/react'
import { DivePackage } from '../../_types'
import { formatCurrency } from '@shared/utils/formatters'

interface DivePackagesSectionProps {
  divePackages: DivePackage[]
}

export default function DivePackagesSection({ divePackages }: DivePackagesSectionProps) {
  if (divePackages.length === 0) return null

  return (
    <Box className="sheet-section" mb={6}>
      <Heading as="h3" size="md" mb={4}>
        Dive Packages
      </Heading>
      <Divider mb={4} />

      <VStack align="stretch" spacing={4}>
        {divePackages.map(pkg => (
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
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
