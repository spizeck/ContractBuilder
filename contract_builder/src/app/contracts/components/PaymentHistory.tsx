'use client'

import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Divider,
  useToast,
  IconButton,
  Link,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { ExternalLinkIcon, DeleteIcon } from '@chakra-ui/icons'
import { Payment } from '@/types/contractTypes'
import { getPayments, deletePayment } from '@/services/payments'
import { formatDateTime } from "@/utils/datetime";
import { formatCurrency, roundToCents } from '@/utils/formatters'

interface PaymentHistoryProps {
  contractId: string
  contractTotalCost: number
  onPaymentDeleted?: () => void
  refreshKey?: number
}

export default function PaymentHistory({ 
  contractId, 
  contractTotalCost, 
  onPaymentDeleted, 
  refreshKey 
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchPayments()
  }, [contractId, refreshKey])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const paymentsData = await getPayments(contractId)
      setPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId: string, contractId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return
    }

    try {
      await deletePayment(paymentId, contractId)
      toast({
        title: 'Payment deleted',
        description: 'Payment has been removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      await fetchPayments()
      onPaymentDeleted?.()
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (loading) {
    return (
      <Box p={4}>
        <Text>Loading payment history...</Text>
      </Box>
    )
  }

  if (payments.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No payments recorded yet for this contract.
      </Alert>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="lg" fontWeight="bold">
        Payment History ({payments.length})
      </Text>
      
      <VStack spacing={3} align="stretch">
        {payments.map((payment) => (
          <Box
            key={payment.id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            bg="cardBg"
          >
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={2} flex={1}>
                <HStack>
                  <Text fontWeight="bold" fontSize="lg">
                    {formatCurrency(payment.amount)}
                  </Text>
                  <Badge colorScheme={
                    payment.paymentType === 'deposit' ? 'yellow' :
                    payment.paymentType === 'full' ? 'green' : 'blue'
                  }>
                    {payment.paymentType}
                  </Badge>
                </HStack>
                
                <Text fontSize="sm" color="textMuted">
                  {payment.paymentMethod} • {formatDateTime(payment.paymentDate)}
                </Text>
                
                <Text fontSize="sm" color="textSecondary">
                  Status: {payment.status}
                </Text>
                
                {payment.notes && (
                  <Text fontSize="sm" color="textPrimary" mt={2}>
                    <strong>Notes:</strong> {payment.notes}
                  </Text>
                )}
                
                {payment.paymentDocumentUrl && (
                  <Link
                    href={payment.paymentDocumentUrl}
                    isExternal
                    color="infoLink"
                    fontSize="sm"
                  >
                    View Document <ExternalLinkIcon mx="2px" />
                  </Link>
                )}
              </VStack>
              
              <IconButton
                aria-label="Delete payment"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleDeletePayment(payment.id, contractId)}
              />
            </HStack>
          </Box>
        ))}
      </VStack>
      
      <Divider />
      
      <Box>
        <Text fontSize="md" fontWeight="bold">
          Total Paid: {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
        </Text>
        <Text fontSize="md" fontWeight="bold">
          Contract Total: {formatCurrency(contractTotalCost)}
        </Text>
        <Text fontSize="md" fontWeight="bold">
          Remaining: {formatCurrency(roundToCents(Math.max(0, contractTotalCost - payments.reduce((sum, p) => sum + p.amount, 0))))}
        </Text>
      </Box>
    </VStack>
  )
}
