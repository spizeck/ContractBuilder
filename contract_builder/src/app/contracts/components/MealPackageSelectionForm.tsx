import { useState, useEffect } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Button,
  Text,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { getMealPackages } from '@/services/mealPackages'
import { MealPackage } from '@/types/contractTypes'

export default function MealPackageSelectionForm ({
  hotelId,
  onNext,
  onBack,
  onCancel,
  initialMealPackageId = ''
}: {
  hotelId: string
  onNext: (data: { mealPackageId: string }) => void
  onBack: () => void
  onCancel: () => void
  initialMealPackageId?: string
}) {
  const [mealPackages, setMealPackages] = useState<MealPackage[]>([])
  const [mealPackageId, setMealPackageId] = useState(initialMealPackageId)

  useEffect(() => {
    const fetchMealPackages = async () => {
      const packages = await getMealPackages(hotelId)
      setMealPackages(packages)
    }
    fetchMealPackages()
  }, [hotelId])

  useEffect(() => {
    setMealPackageId(initialMealPackageId || '')
  }, [initialMealPackageId])

  const handleSubmit = () => {
    if (!mealPackageId) {
      alert('Please select a meal package.')
      return
    }
    onNext({ mealPackageId })
  }

  const selectedPkg = mealPackages.find(pkg => pkg.id === mealPackageId)

  return (
    <VStack spacing={4} align='stretch'>
      <HStack justifyContent='space-between'>
        <Text fontSize='xl' fontWeight='bold'>
          Select Meal Package
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
        <FormLabel>Meal Package</FormLabel>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            w='100%'
            textAlign='left'
            variant='outline'
          >
            {selectedPkg ? selectedPkg.name : 'Select a meal package'}
          </MenuButton>
          <MenuList w='100%' maxHeight='500px' overflowY='auto'>
            {mealPackages.map(pkg => (
              <MenuItem key={pkg.id} onClick={() => setMealPackageId(pkg.id)}>
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
