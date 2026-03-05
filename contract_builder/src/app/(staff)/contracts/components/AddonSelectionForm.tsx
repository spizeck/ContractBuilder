import { useState } from 'react'
import {
  Button,
  Input,
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  IconButton,
  Divider,
  useToast,
} from '@chakra-ui/react'
import { DeleteIcon, AddIcon } from '@chakra-ui/icons'
import { formatCurrency } from '@shared/utils/formatters'

interface Addon {
  description: string
  amount: number
}

interface AddonData {
  hotelAddons: Addon[]
  diveAddons: Addon[]
  mealAddons: Addon[]
}

export default function AddonSelectionForm({
  initialAddons,
  bookingType,
  onNext,
  onBack,
  onCancel
}: {
  initialAddons?: Partial<AddonData>
  bookingType?: string
  onNext: (data: AddonData) => void
  onBack: () => void
  onCancel: () => void
}) {
  const toast = useToast()
  const [hotelAddons, setHotelAddons] = useState<Addon[]>(
    initialAddons?.hotelAddons || []
  )
  const [diveAddons, setDiveAddons] = useState<Addon[]>(
    initialAddons?.diveAddons || []
  )
  const [mealAddons, setMealAddons] = useState<Addon[]>(
    initialAddons?.mealAddons || []
  )

  const addAddon = (type: 'hotel' | 'dive' | 'meal') => {
    const newAddon: Addon = { description: '', amount: 0 }
    
    switch (type) {
      case 'hotel':
        setHotelAddons([...hotelAddons, newAddon])
        break
      case 'dive':
        setDiveAddons([...diveAddons, newAddon])
        break
      case 'meal':
        setMealAddons([...mealAddons, newAddon])
        break
    }
  }

  const updateAddon = (
    type: 'hotel' | 'dive' | 'meal',
    index: number,
    field: 'description' | 'amount',
    value: string | number
  ) => {
    const updateList = (list: Addon[]) => {
      const updated = [...list]
      if (field === 'amount') {
        updated[index][field] = Number(value) || 0
      } else {
        updated[index][field] = String(value)
      }
      return updated
    }

    switch (type) {
      case 'hotel':
        setHotelAddons(updateList(hotelAddons))
        break
      case 'dive':
        setDiveAddons(updateList(diveAddons))
        break
      case 'meal':
        setMealAddons(updateList(mealAddons))
        break
    }
  }

  const removeAddon = (type: 'hotel' | 'dive' | 'meal', index: number) => {
    switch (type) {
      case 'hotel':
        setHotelAddons(hotelAddons.filter((_, i) => i !== index))
        break
      case 'dive':
        setDiveAddons(diveAddons.filter((_, i) => i !== index))
        break
      case 'meal':
        setMealAddons(mealAddons.filter((_, i) => i !== index))
        break
    }
  }

  const calculateTotal = (addons: Addon[]) => {
    return addons.reduce((sum, addon) => sum + addon.amount, 0)
  }

  const handleSubmit = () => {
    // Validate that all addons have descriptions (amount can be positive or negative for discounts)
    const allAddons = [...hotelAddons, ...diveAddons, ...mealAddons]
    const invalidAddons = allAddons.filter(
      addon => !addon.description.trim()
    )

    if (invalidAddons.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'All addons must have a description. Amount can be positive (charge) or negative (discount).',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    // For direct hotel booking, clear hotel and meal addons
    const finalHotelAddons = bookingType === 'directHotelBooking' ? [] : hotelAddons
    const finalMealAddons = bookingType === 'directHotelBooking' ? [] : mealAddons

    onNext({
      hotelAddons: finalHotelAddons,
      diveAddons,
      mealAddons: finalMealAddons,
    })
  }

  const renderAddonSection = (
    title: string,
    addons: Addon[],
    type: 'hotel' | 'dive' | 'meal'
  ) => (
    <Box>
      <Heading size="md" mb={3}>{title}</Heading>
      
      {addons.length === 0 ? (
        <Text color="textMuted" mb={3}>
          No {title.toLowerCase()} added
        </Text>
      ) : (
        <VStack spacing={3} mb={3}>
          {addons.map((addon, index) => (
            <HStack key={index} spacing={2} width="100%">
              <Input
                placeholder="Description"
                value={addon.description}
                onChange={(e) => updateAddon(type, index, 'description', e.target.value)}
                flex={2}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={addon.amount || ''}
                onChange={(e) => updateAddon(type, index, 'amount', e.target.value)}
                flex={1}
                min={0}
                step={0.01}
              />
              <IconButton
                aria-label="Remove addon"
                icon={<DeleteIcon />}
                onClick={() => removeAddon(type, index)}
                colorScheme="red"
                variant="outline"
                size="sm"
              />
            </HStack>
          ))}
        </VStack>
      )}

      <Button
        leftIcon={<AddIcon />}
        onClick={() => addAddon(type)}
        variant="outline"
        size="sm"
        width="full"
      >
        Add {title.slice(0, -1)}
      </Button>

      {addons.length > 0 && (
        <Box mt={3} p={3} bg="cardBgAlt" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium">
            {title} Total: {formatCurrency(calculateTotal(addons))}
          </Text>
        </Box>
      )}
    </Box>
  )

  const grandTotal = calculateTotal(hotelAddons) + calculateTotal(diveAddons) + calculateTotal(mealAddons)

  return (
    <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="border">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Addons</Heading>
          <Text color="textMuted" fontSize="sm">
            Add optional hotel, dive, and meal addons to the contract
          </Text>
        </Box>

        <VStack spacing={6} align="stretch">
          {/* Only show hotel addons if not direct hotel booking */}
          {bookingType !== 'directHotelBooking' && (
            <>
              {renderAddonSection('Hotel Addons', hotelAddons, 'hotel')}
              <Divider />
            </>
          )}
          
          {renderAddonSection('Dive Addons', diveAddons, 'dive')}
          
          {/* Only show meal addons if not direct hotel booking */}
          {bookingType !== 'directHotelBooking' && (
            <>
              <Divider />
              {renderAddonSection('Meal Addons', mealAddons, 'meal')}
            </>
          )}
        </VStack>

        {grandTotal > 0 && (
          <Box p={4} bg="infoBg" borderRadius="md">
            <Text fontSize="lg" fontWeight="bold">
              Total Addons: {formatCurrency(grandTotal)}
            </Text>
          </Box>
        )}

        <HStack spacing={3} width="100%" direction={{ base: 'column', md: 'row' }}>
          <Button onClick={onBack} flex={1} variant="outline">
            Back
          </Button>
          <Button 
            onClick={() => onCancel()} 
            flex={1} 
            variant="ghost"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            colorScheme="teal" 
            flex={1}
          >
            Next
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
