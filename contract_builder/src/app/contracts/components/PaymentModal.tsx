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
  useToast,
} from '@chakra-ui/react'
import { addPayment } from '@/services/payments'
import { Payment } from '@/types/contractTypes'
import { useAuth } from '@/context/AuthContext'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  contractTotalCost: number
  totalPaid: number
  onPaymentAdded: (payment: Payment) => void
}

export default function PaymentModal({
  isOpen,
  onClose,
  contractId,
  contractTotalCost,
  totalPaid,
  onPaymentAdded,
}: PaymentModalProps) {
  const { user } = useAuth()
  const [payment, setPayment] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentType: 'deposit',
    notes: '',
    receiptUrl: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const remainingBalance = contractTotalCost - totalPaid
  const progressPercentage = (totalPaid / contractTotalCost) * 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid payment amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsSubmitting(true)
      setUploadProgress(0)

      const newPayment = await addPayment(
        contractId,
        {
          amount: parseFloat(payment.amount),
          paymentMethod: payment.paymentMethod as Payment['paymentMethod'],
          paymentType: payment.paymentType as Payment['paymentType'],
          notes: payment.notes,
          paymentDate: new Date(),
          status: 'confirmed',
          paymentDocumentUrl: payment.receiptUrl,
          createdBy: user?.uid || '',
          createdByName: user?.displayName || '',
        },
        undefined,
        (progress: number) => setUploadProgress(progress)
      )

      toast({
        title: 'Payment added',
        description: 'Payment has been recorded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      onPaymentAdded(newPayment)
      handleClose()
    } catch (error) {
      console.error('Error adding payment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add payment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    setPayment({
      amount: '',
      paymentMethod: 'cash',
      paymentType: 'deposit',
      notes: '',
      receiptUrl: '',
    })
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // For now, just store the file name
      // In a real implementation, you'd upload to a storage service
      setPayment(prev => ({
        ...prev,
        receiptUrl: file.name
      }))
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Upload error',
        description: 'Failed to upload receipt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Payment</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              {/* Payment Summary */}
              <Box w="full">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Contract Total: ${contractTotalCost.toLocaleString()}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Already Paid: ${totalPaid.toLocaleString()}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Remaining Balance: ${remainingBalance.toLocaleString()}
                </Text>
                <Progress 
                  value={progressPercentage} 
                  colorScheme="green" 
                  size="sm" 
                  mt={2}
                />
              </Box>

              {/* Payment Amount */}
              <FormControl isRequired>
                <FormLabel>Payment Amount</FormLabel>
                <NumberInput
                  value={payment.amount}
                  onChange={(value) => setPayment(prev => ({ ...prev, amount: value }))}
                  min={0}
                  max={remainingBalance}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {/* Payment Method */}
              <FormControl>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  value={payment.paymentMethod}
                  onChange={(e) => setPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit">Credit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              {/* Payment Type */}
              <FormControl>
                <FormLabel>Payment Type</FormLabel>
                <Select
                  value={payment.paymentType}
                  onChange={(e) => setPayment(prev => ({ ...prev, paymentType: e.target.value }))}
                >
                  <option value="deposit">Deposit</option>
                  <option value="full">Full Payment</option>
                </Select>
              </FormControl>

              {/* Notes */}
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={payment.notes}
                  onChange={(e) => setPayment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                />
              </FormControl>

              {/* Receipt Upload */}
              <FormControl>
                <FormLabel>Receipt (Optional)</FormLabel>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                />
                {payment.receiptUrl && (
                  <Text fontSize="sm" color="green.600" mt={2}>
                    Receipt attached: {payment.receiptUrl}
                  </Text>
                )}
              </FormControl>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <Box w="full">
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Uploading receipt: {uploadProgress}%
                  </Text>
                  <Progress value={uploadProgress} colorScheme="blue" size="sm" />
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              loadingText="Adding Payment..."
            >
              Add Payment
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
