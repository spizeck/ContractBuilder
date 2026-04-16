import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { DivePackage } from '../../_types'
import { formatCurrency } from '@shared/utils/formatters'

interface DivePackagesSectionProps {
  divePackages: DivePackage[]
}

export default function DivePackagesSection({ divePackages }: DivePackagesSectionProps) {
  if (divePackages.length === 0) return null

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
        Dive Packages
      </Heading>

      <VStack align="stretch" spacing={3}>
        {divePackages.map(pkg => (
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
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
