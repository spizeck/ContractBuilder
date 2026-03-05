import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
  Checkbox
} from '@chakra-ui/react'
import { addRoomType, updateRoomType } from '@/app/(staff)/contracts/_lib/roomTypesRepo'

import { RoomCategory, RoomType } from '@/app/(staff)/contracts/_types'

export default function AddEditRoomTypeForm ({
  hotelId,
  categories,
  roomType,
  onCancel,
  onSubmit
}: {
  hotelId: string
  categories: RoomCategory[]
  roomType?: RoomType
  onCancel: () => void
  onSubmit: () => void
}) {
  const [roomTypeData, setRoomTypeData] = useState<Omit<RoomType, 'id'>>({
    hotelId: '',
    categoryId: '',
    name: '',
    description: '',
    quantity: 0,
    isFocBase: false
  })

  useEffect(() => {
    if (roomType) {
      setRoomTypeData({
        hotelId: roomType.hotelId || hotelId,
        categoryId: roomType.categoryId || '',
        name: roomType.name || '',
        description: roomType.description || '',
        quantity: roomType.quantity || 0,
        isFocBase: roomType.isFocBase || false
      })
    }
  }, [roomType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (!name) return // Guard against undefined name
    setRoomTypeData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoomTypeData({
      ...roomTypeData,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomTypeData({
      ...roomTypeData,
      isFocBase: e.target.checked
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (roomType) {
      await updateRoomType(roomType.id, roomTypeData)
    } else {
      await addRoomType({ ...roomTypeData, hotelId })
    }
    onSubmit()
  }

  return (
    <Box p={4} maxW='500px' mx='auto'>
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={5} align='stretch'>
          <FormControl isRequired>
            <FormLabel>Room Type Name</FormLabel>
            <Input
              name='name'
              value={roomTypeData.name}
              onChange={handleInputChange}
              placeholder='Enter room type name'
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Category</FormLabel>
            <Select
              name='categoryId'
              value={roomTypeData.categoryId}
              onChange={handleSelectChange}
            >
              <option value=''>Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              name='description'
              value={roomTypeData.description}
              onChange={handleInputChange}
              placeholder='Enter description'
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Quantity</FormLabel>
            <Input
              name='quantity'
              type='number'
              value={roomTypeData.quantity}
              onChange={handleInputChange}
            />
          </FormControl>
          <FormControl>
            <Checkbox
              isChecked={roomTypeData.isFocBase}
              onChange={handleCheckboxChange}
            >
              Use this room type as FOC Base
            </Checkbox>
          </FormControl>
          <HStack spacing={4} mt={2} width={'100%'}>
            <Button type='submit' colorScheme='teal' flex={'1'}>
              {roomType ? 'Update' : 'Add'}
            </Button>
            <Button onClick={onCancel} colorScheme='gray' flex={'1'}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  )
}
