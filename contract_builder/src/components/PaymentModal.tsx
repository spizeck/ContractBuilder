'use client'

import { useState, useRef } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Progress,
  Box,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react'
import { useAuth } from '@/context/AuthContext'
import { addPayment } from '@/services/payments'
import { Payment } from '@/types/contractTypes'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  contractTotalCost: number
  onPaymentAdded: (payment: Payment) => void
}

export default function PaymentModal({
  isOpen,
  onClose,
  contractId,
  contractTotalCost,
  onPaymentAdded
}: PaymentModalProps) {
  const { user } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    amount: 0,
    paymentMethod: 'check' as 'check' | 'wire' | 'card' | 'cash',
    paymentType: 'deposit' as 'deposit' | 'partial' | 'full' | 'other',
    notes: ''
  })

  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (formData.amount > contractTotalCost) {
      newErrors.amount = `Amount cannot exceed contract total of $${contractTotalCost.toLocaleString()}`
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required'
    }

    if (!formData.paymentType) {
      newErrors.paymentType = 'Payment type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, JPG, or PNG file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      setPaymentFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm() || !user) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const payment = await addPayment(
        contractId,
        {
          ...formData,
          paymentDate: new Date(),
          status: 'confirmed',
          createdBy: user.uid,
          createdByName: user.displayName || user.email || undefined
        },
        paymentFile || undefined,
        (progress) => {
          setUploadProgress(progress)
        }
      )

      toast({
        title: 'Payment added successfully',
        description: `Payment of $${formData.amount.toLocaleString()} has been recorded`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      onPaymentAdded(payment)
      handleClose()
    } catch (error) {
      console.error('Error adding payment:', error)
      toast({
        title: 'Failed to add payment',
        description: 'There was an error recording the payment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    setFormData({
      amount: 0,
      paymentMethod: 'check',
      paymentType: 'deposit',
      notes: ''
    })
    setPaymentFile(null)
    setErrors({})
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Payment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!errors.amount}>
              <FormLabel>Payment Amount ($)</FormLabel>
              <NumberInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: parseFloat(value) || 0 })}
                min={0}
                max={contractTotalCost}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.amount}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.paymentMethod}>
              <FormLabel>Payment Method</FormLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              >
                <option value="check">Check</option>
                <option value="wire">Wire Transfer</option>
                <option value="card">Credit Card</option>
                <option value="cash">Cash</option>
              </Select>
              <FormErrorMessage>{errors.paymentMethod}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.paymentType}>
              <FormLabel>Payment Type</FormLabel>
              <Select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
              >
                <option value="deposit">Deposit</option>
                <option value="partial">Partial Payment</option>
                <option value="full">Full Payment</option>
                <option value="other">Other</option>
              </Select>
              <FormErrorMessage>{errors.paymentType}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Payment Document (Optional)</FormLabel>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {paymentFile && (
                <Text mt={2} fontSize="sm" color="gray.600">
                  Selected: {paymentFile.name} ({(paymentFile.size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this payment..."
                rows={3}
              />
            </FormControl>

            {isUploading && (
              <Box>
                <Text mb={2}>Uploading payment document...</Text>
                <Progress value={uploadProgress} size="sm" colorScheme="blue" />
              </Box>
            )}

            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text fontSize="sm">
                  Contract Total: <strong>${contractTotalCost.toLocaleString()}</strong>
                </Text>
                <Text fontSize="sm">
                  Remaining after this payment: <strong>
                    ${(contractTotalCost - formData.amount).toLocaleString()}
                  </strong>
                </Text>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={handleClose}
              isDisabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isUploading}
              loadingText="Adding Payment..."
            >
              Add Payment
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
