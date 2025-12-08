'use client'

import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Button,
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
import { formatDateTime } from '@/utils/dateHelpers'
import PaymentStatusBadge from './PaymentStatusBadge'

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
  refreshKey = 0
}: PaymentHistoryProps) {
  const toast = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [contractId, refreshKey])

  const fetchPayments = async () => {
    try {
      const paymentsData = await getPayments(contractId)
      setPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: 'Failed to load payments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm(`Are you sure you want to delete this payment of $${payment.amount.toLocaleString()}?`)) {
      return
    }

    try {
      await deletePayment(payment.id, contractId, payment.paymentDocumentUrl)
      setPayments(payments.filter(p => p.id !== payment.id))
      
      toast({
        title: 'Payment deleted',
        description: 'The payment has been removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      onPaymentDeleted?.()
    } catch (error) {
      toast({
        title: 'Failed to delete payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remaining = contractTotalCost - totalPaid

  // Theme-sensitive colors using semantic tokens

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      check: 'blue',
      wire: 'purple',
      card: 'green',
      cash: 'orange'
    }
    return (
      <Badge colorScheme={colors[method] || 'gray'} variant="solid">
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </Badge>
    )
  }

  const getPaymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'yellow',
      partial: 'orange',
      full: 'green',
      other: 'gray'
    }
    return (
      <Badge colorScheme={colors[type] || 'gray'} variant="outline">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return <Text>Loading payment history...</Text>
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Payment Summary */}
        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="borderAlt">
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="bold">Total Paid:</Text>
              <Text fontWeight="bold" color="paid">
                ${totalPaid.toLocaleString()}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Contract Total:</Text>
              <Text>${contractTotalCost.toLocaleString()}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="bold">Remaining:</Text>
              <Text 
                fontWeight="bold" 
                color={remaining > 0 ? "unpaid" : "paid"}
              >
                ${remaining.toLocaleString()}
              </Text>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* Payments List */}
        {payments.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No payments recorded yet. Add the first payment using the button above.
          </Alert>
        ) : (
          <VStack spacing={3} align="stretch">
            {payments.map((payment) => (
              <Box key={payment.id} p={4} borderWidth="1px" borderRadius="md">
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2} flex={1}>
                    <HStack spacing={2}>
                      <Text fontSize="lg" fontWeight="bold">
                        ${payment.amount.toLocaleString()}
                      </Text>
                      {getPaymentMethodBadge(payment.paymentMethod)}
                      {getPaymentTypeBadge(payment.paymentType)}
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600">
                      {formatDateTime(payment.paymentDate)}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.500">
                      Added by {payment.createdByName || payment.createdBy} • {formatDateTime(payment.createdAt)}
                    </Text>

                    {payment.notes && (
                      <Text fontSize="sm" fontStyle="italic" color="gray.700">
                        "{payment.notes}"
                      </Text>
                    )}

                    {payment.paymentDocumentUrl && (
                      <Link
                        href={payment.paymentDocumentUrl}
                        isExternal
                        color="info"
                        fontSize="sm"
                        display="inline-flex"
                        alignItems="center"
                        bg="cardBgAlt"
                      >
                        <ExternalLinkIcon boxSize={3} />
                        View {payment.paymentDocumentType || 'document'}
                      </Link>
                    )}
                  </VStack>

                  <IconButton
                    aria-label="Delete payment"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeletePayment(payment)}
                  />
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
