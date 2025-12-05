'use client'

import { useState, useRef } from 'react'
import {
  Box,
  Button,
  VStack,
  Text,
  Input,
  useToast,
  Progress,
  HStack,
  Link,
  IconButton,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react'
import { ExternalLinkIcon, DeleteIcon } from '@chakra-ui/icons'
import { uploadSignedContract, deleteSignedContract, validateContractFile } from '@/services/fileUpload'
import { useAuth } from '@/context/AuthContext'

interface SignedContractUploadProps {
  contractId: string
  currentUrl?: string | null
  uploadedAt?: Date | null
  uploadedBy?: string | null
  onUploadSuccess?: (url: string) => void
  onDeleteSuccess?: () => void
}

export default function SignedContractUpload({
  contractId,
  currentUrl,
  uploadedAt,
  uploadedBy,
  onUploadSuccess,
  onDeleteSuccess,
}: SignedContractUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file
    const validation = validateContractFile(file)
    if (!validation.isValid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const url = await uploadSignedContract(contractId, file, user.uid)
      toast({
        title: 'Upload successful',
        description: 'Signed contract has been uploaded successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      onUploadSuccess?.(url)
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the signed contract.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!currentUrl) return

    try {
      await deleteSignedContract(contractId, currentUrl)
      toast({
        title: 'File deleted',
        description: 'Signed contract has been removed successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      onDeleteSuccess?.()
      onClose()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'There was an error deleting the signed contract.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box borderWidth={1} borderRadius="lg" p={4} bg="gray.50">
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold" fontSize="lg">
          Signed Contract
        </Text>
        
        <Alert status="info">
          <AlertIcon />
          Upload the signed contract PDF (max 10MB)
        </Alert>

        {currentUrl ? (
          <VStack spacing={3} align="stretch">
            <Text color="green.600" fontWeight="medium">
              ✓ Signed contract uploaded
            </Text>
            
            {/* Upload Metadata */}
            {(uploadedAt || uploadedBy) && (
              <Box bg="blue.50" p={3} borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" color="blue.800">
                  Upload Information:
                </Text>
                {uploadedAt && (
                  <Text fontSize="sm" color="blue.700">
                    Uploaded: {uploadedAt.toLocaleDateString()} at {uploadedAt.toLocaleTimeString()}
                  </Text>
                )}
                {uploadedBy && (
                  <Text fontSize="sm" color="blue.700">
                    Uploaded by: {uploadedBy}
                  </Text>
                )}
              </Box>
            )}
            
            <HStack>
              <Link
                href={currentUrl}
                isExternal
                color="blue.500"
                textDecoration="underline"
              >
                View Signed Contract
              </Link>
              <IconButton
                as="a"
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in new tab"
                icon={<ExternalLinkIcon />}
                size="sm"
                variant="ghost"
              />
            </HStack>
            <Button
              leftIcon={<DeleteIcon />}
              colorScheme="red"
              variant="outline"
              onClick={onOpen}
              size="sm"
            >
              Remove Signed Contract
            </Button>
          </VStack>
        ) : (
          <VStack spacing={3} align="stretch">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={isUploading}
              display="none"
            />
            <Button
              as="label"
              htmlFor="file-upload"
              colorScheme="blue"
              isLoading={isUploading}
              loadingText="Uploading..."
              cursor="pointer"
            >
              Choose PDF File
            </Button>
            <Box as="label" htmlFor="file-upload" cursor="pointer">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={isUploading}
                display="none"
              />
              <Text fontSize="sm" color="gray.600">
                Click to select a PDF file or drag and drop
              </Text>
            </Box>
            
            {isUploading && (
              <Box>
                <Progress value={uploadProgress} size="sm" colorScheme="blue" />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Uploading...
                </Text>
              </Box>
            )}
          </VStack>
        )}
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Signed Contract
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete the signed contract? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
