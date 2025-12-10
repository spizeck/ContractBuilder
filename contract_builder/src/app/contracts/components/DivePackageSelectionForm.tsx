import { useState, useEffect } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { getDivePackages } from '@/services/divePackages'
import { DivePackage } from '@/types/contractTypes'

export default function DivePackageSelectionForm ({
  hotelId,
  onNext,
  onBack,
  onCancel,
  initialDivePackageId = '',
  initialNumDivers = 0
}: {
  hotelId: string
  onNext: (data: { divePackageId: string; numDivers: number }) => void
  onBack: () => void
  onCancel: () => void
  initialDivePackageId?: string
  initialNumDivers?: number
}) {
  const [divePackages, setDivePackages] = useState<DivePackage[]>([])
  const [divePackageId, setDivePackageId] = useState(initialDivePackageId)
  const [numDivers, setNumDivers] = useState(initialNumDivers)

  useEffect(() => {
    const fetchData = async () => {
      const packages = await getDivePackages()
      setDivePackages(packages)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (initialDivePackageId) setDivePackageId(initialDivePackageId || '')
  }, [initialDivePackageId])

  useEffect(() => {
    if (initialNumDivers) setNumDivers(initialNumDivers || 0)
  }, [initialNumDivers])

  const handleSubmit = () => {
    const validDivers = Number.isFinite(numDivers) && numDivers > 0
    if (!divePackageId || !validDivers) {
      alert('Please select a dive package and enter a valid number of divers.')
      return
    }
    onNext({ divePackageId, numDivers })
  }

  const selectedPkg = divePackages.find(pkg => pkg.id === divePackageId)

  return (
    <VStack spacing={4} align='stretch'>
      <HStack justifyContent='space-between'>
        <Text fontSize='xl' fontWeight='bold'>
          Select Dive Package
        </Text>
        <Button
          colorScheme='red'
          onClick={() => {
            if (
              window.confirm('All progress will be discarded. Are you sure?')
            ) {
              onCancel()
            }
          }}
        >
          Cancel
        </Button>
      </HStack>
      <FormControl isRequired>
        <FormLabel>Dive Package</FormLabel>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            w='100%'
            textAlign='left'
            variant='outline'
          >
            {selectedPkg ? selectedPkg.name : 'Select a dive package'}
          </MenuButton>
          <MenuList w='100%' maxHeight='500px' overflowY='auto'>
            {divePackages.map(pkg => (
              <MenuItem key={pkg.id} onClick={() => setDivePackageId(pkg.id)}>
                {pkg.name}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        {selectedPkg?.description && (
          <Text fontSize='sm' color='textPrimary' mt={2}>
            {selectedPkg.description}
          </Text>
        )}
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Number of Divers</FormLabel>
        <Input
          type='number'
          min={1}
          value={numDivers}
          onChange={e => setNumDivers(parseInt(e.target.value) || 0)}
        />
      </FormControl>

      <HStack spacing={2} w='100%'>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme='teal' onClick={handleSubmit} flex={1}>
          Next
        </Button>
      </HStack>
    </VStack>
  )
}
