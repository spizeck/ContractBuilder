'use client'

import { useMemo } from 'react'
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Text,
  VStack,
  HStack,
  Button,
  Divider
} from '@chakra-ui/react'
import { GroupContract } from '@/types/contractTypes'
import PaymentStatusBadge from '@/components/PaymentStatusBadge'

interface PaymentDashboardProps {
  contracts: GroupContract[]
  onFilterByStatus?: (status: string) => void
}

interface PaymentMetrics {
  totalContracts: number
  totalRevenue: number
  unpaidRevenue: number
  depositPaidRevenue: number
  partialPaymentRevenue: number
  paidInFullRevenue: number
  unpaidCount: number
  depositPaidCount: number
  partialPaymentCount: number
  paidInFullCount: number
}

export default function PaymentDashboard({ contracts, onFilterByStatus }: PaymentDashboardProps) {
  const metrics = useMemo((): PaymentMetrics => {
    const initial: PaymentMetrics = {
      totalContracts: 0,
      totalRevenue: 0,
      unpaidRevenue: 0,
      depositPaidRevenue: 0,
      partialPaymentRevenue: 0,
      paidInFullRevenue: 0,
      unpaidCount: 0,
      depositPaidCount: 0,
      partialPaymentCount: 0,
      paidInFullCount: 0
    }

    return contracts.reduce((acc, contract) => {
      const cost = contract.totalCost || 0
      acc.totalContracts++
      acc.totalRevenue += cost

      if (contract.paidInFull) {
        acc.paidInFullRevenue += cost
        acc.paidInFullCount++
      } else if (contract.depositPaid && contract.totalPaid && contract.totalPaid > 0) {
        acc.partialPaymentRevenue += cost
        acc.partialPaymentCount++
      } else if (contract.depositPaid) {
        acc.depositPaidRevenue += cost
        acc.depositPaidCount++
      } else {
        acc.unpaidRevenue += cost
        acc.unpaidCount++
      }

      return acc
    }, initial)
  }, [contracts])

  // Color values now come from semantic tokens in theme

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <VStack spacing={6} align="stretch">
      
      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Total Contracts</StatLabel>
            <StatNumber fontSize="3xl">{metrics.totalContracts}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.totalRevenue)} total value
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Unpaid</StatLabel>
            <StatNumber fontSize="3xl" color="unpaid">{metrics.unpaidCount}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.unpaidRevenue)} outstanding
            </StatHelpText>
          </Stat>
          {onFilterByStatus && (
            <Button 
              size="sm" 
              colorScheme="red" 
              variant="outline" 
              mt={3}
              onClick={() => onFilterByStatus('unpaid')}
            >
              View Unpaid
            </Button>
          )}
        </Box>

        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Deposit Paid</StatLabel>
            <StatNumber fontSize="3xl" color="deposit">{metrics.depositPaidCount}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.depositPaidRevenue)} in deposits
            </StatHelpText>
          </Stat>
          {onFilterByStatus && (
            <Button 
              size="sm" 
              colorScheme="yellow" 
              variant="outline" 
              mt={3}
              onClick={() => onFilterByStatus('deposit-paid')}
            >
              View Deposits
            </Button>
          )}
        </Box>

        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Paid in Full</StatLabel>
            <StatNumber fontSize="3xl" color="paid">{metrics.paidInFullCount}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.paidInFullRevenue)} collected
            </StatHelpText>
          </Stat>
          {onFilterByStatus && (
            <Button 
              size="sm" 
              colorScheme="green" 
              variant="outline" 
              mt={3}
              onClick={() => onFilterByStatus('paid-in-full')}
            >
              View Paid
            </Button>
          )}
        </Box>
      </SimpleGrid>

      {/* Revenue Breakdown */}
      <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Revenue by Payment Status</Text>
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <PaymentStatusBadge contract={{ paymentStatus: 'unpaid' } as GroupContract} />
              <Text fontWeight="medium">{metrics.unpaidCount} contracts</Text>
            </HStack>
            <Text fontWeight="bold" color="unpaid">
              {formatCurrency(metrics.unpaidRevenue)}
            </Text>
          </HStack>
          
          <HStack justify="space-between">
            <HStack>
              <PaymentStatusBadge contract={{ paymentStatus: 'deposit-paid' } as GroupContract} />
              <Text fontWeight="medium">{metrics.depositPaidCount} contracts</Text>
            </HStack>
            <Text fontWeight="bold" color="deposit">
              {formatCurrency(metrics.depositPaidRevenue)}
            </Text>
          </HStack>
          
          <HStack justify="space-between">
            <HStack>
              <PaymentStatusBadge contract={{ paymentStatus: 'partial-payment' } as GroupContract} />
              <Text fontWeight="medium">{metrics.partialPaymentCount} contracts</Text>
            </HStack>
            <Text fontWeight="bold" color="partial">
              {formatCurrency(metrics.partialPaymentRevenue)}
            </Text>
          </HStack>
          
          <HStack justify="space-between">
            <HStack>
              <PaymentStatusBadge contract={{ paymentStatus: 'paid-in-full' } as GroupContract} />
              <Text fontWeight="medium">{metrics.paidInFullCount} contracts</Text>
            </HStack>
            <Text fontWeight="bold" color="paid">
              {formatCurrency(metrics.paidInFullRevenue)}
            </Text>
          </HStack>
          
          <Divider />
          <HStack justify="space-between">
            <Text fontWeight="bold">Total Revenue</Text>
            <Text fontWeight="bold" fontSize="lg">
              {formatCurrency(metrics.totalRevenue)}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  )
}
