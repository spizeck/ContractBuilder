'use client'

import { useState } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@core/db/firebase'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Image,
  VStack,
  HStack,
  Text,
  useToast,
  Input,
} from '@chakra-ui/react'
import { Upload, Trash2 } from 'lucide-react'

interface LogoUploadProps {
  hotelId: string
  currentLogoUrl?: string
  onLogoChange: (url: string | undefined) => void
}

export default function LogoUpload({ hotelId, currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, SVG)',
        status: 'error',
        duration: 3000,
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      setUploading(true)

      // Create a reference to the file location
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const storageRef = ref(storage, `hotels/${hotelId}/logo/${fileName}`)

      // Upload the file
      await uploadBytes(storageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Delete old logo if exists
      if (currentLogoUrl) {
        try {
          const oldRef = ref(storage, currentLogoUrl)
          await deleteObject(oldRef)
        } catch (error) {
          console.error('Error deleting old logo:', error)
        }
      }

      onLogoChange(downloadURL)

      toast({
        title: 'Logo uploaded',
        description: 'Hotel logo has been uploaded successfully',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!currentLogoUrl) return

    try {
      setDeleting(true)

      // Delete from storage
      const storageRef = ref(storage, currentLogoUrl)
      await deleteObject(storageRef)

      onLogoChange(undefined)

      toast({
        title: 'Logo deleted',
        description: 'Hotel logo has been removed',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete logo. Please try again.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <FormControl>
      <FormLabel>Hotel Logo</FormLabel>
      <FormHelperText mb={3}>
        Recommended size: 300x100 pixels (3:1 aspect ratio). Max file size: 2MB. 
        Supported formats: PNG, JPG, SVG
      </FormHelperText>

      {currentLogoUrl ? (
        <VStack align="stretch" spacing={3}>
          <Box
            borderWidth={1}
            borderRadius="md"
            p={4}
            bg="gray.50"
            display="flex"
            justifyContent="center"
            alignItems="center"
            minH="120px"
          >
            <Image
              src={currentLogoUrl}
              alt="Hotel logo"
              maxH="100px"
              maxW="300px"
              objectFit="contain"
            />
          </Box>
          <HStack>
            <Button
              as="label"
              leftIcon={<Upload size={16} />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              isLoading={uploading}
              cursor="pointer"
            >
              Replace Logo
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                display="none"
              />
            </Button>
            <Button
              leftIcon={<Trash2 size={16} />}
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Remove Logo
            </Button>
          </HStack>
        </VStack>
      ) : (
        <Button
          as="label"
          leftIcon={<Upload size={16} />}
          colorScheme="blue"
          variant="outline"
          isLoading={uploading}
          cursor="pointer"
        >
          Upload Logo
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            display="none"
          />
        </Button>
      )}
    </FormControl>
  )
}
