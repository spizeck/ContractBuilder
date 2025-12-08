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
import PaymentStatusBadge from './PaymentStatusBadge'

interface PaymentDashboardProps {
  contracts: GroupContract[]
  onFilterByStatus?: (status: string) => void
}

interface PaymentMetrics {
  totalContracts: number
  totalRevenue: number
  // Summary card amounts (actual payment amounts)
  unpaidAmount: number
  unpaidCount: number
  depositAmount: number
  depositPaidCount: number
  paidInFullAmount: number
  paidInFullCount: number
  // Revenue by Payment Status amounts (total contract values)
  unpaidRevenue: number
  depositPaidRevenue: number
  paidInFullRevenue: number
}

export default function PaymentDashboard({ contracts, onFilterByStatus }: PaymentDashboardProps) {

  const metrics = useMemo((): PaymentMetrics => {
    const initial: PaymentMetrics = {
      totalContracts: 0,
      totalRevenue: 0,
      // Summary card amounts (actual payment amounts)
      unpaidAmount: 0,
      unpaidCount: 0,
      depositAmount: 0,
      depositPaidCount: 0,
      paidInFullAmount: 0,
      paidInFullCount: 0,
      // Revenue by Payment Status amounts (total contract values)
      unpaidRevenue: 0,
      depositPaidRevenue: 0,
      paidInFullRevenue: 0
    }

    return contracts.reduce((acc, contract) => {
      const cost = contract.totalCost || 0
      const paid = contract.totalPaid || 0
      acc.totalContracts++
      acc.totalRevenue += cost

      if (contract.paidInFull) {
        // Summary cards: actual payment amounts
        acc.paidInFullAmount += paid
        acc.paidInFullCount++
        // Revenue by Payment Status: total contract values
        acc.paidInFullRevenue += cost
      } else if (contract.depositPaid) {
        // Summary cards: actual payment amounts
        acc.depositAmount += paid
        acc.depositPaidCount++
        // Revenue by Payment Status: total contract values
        acc.depositPaidRevenue += cost
      } else {
        // Summary cards: actual unpaid amounts
        acc.unpaidAmount += cost
        acc.unpaidCount++
        // Revenue by Payment Status: total contract values
        acc.unpaidRevenue += cost
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
              {formatCurrency(metrics.unpaidAmount)} outstanding
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
              {formatCurrency(metrics.depositAmount)} in deposits
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
              {formatCurrency(metrics.paidInFullAmount)} collected
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
              <PaymentStatusBadge contract={{ 
                groupName: 'Unpaid',
                totalPaid: 0, 
                depositPaid: false, 
                paidInFull: false 
              } as GroupContract} />
              <Text fontWeight="medium">{metrics.unpaidCount} contracts</Text>
            </HStack>
            <Text fontWeight="bold" color="unpaid">
              {formatCurrency(metrics.unpaidRevenue)}
            </Text>
          </HStack>
          
          <HStack justify="space-between">
            <HStack>
              <PaymentStatusBadge contract={{ 
                totalPaid: 500, 
                depositPaid: true, 
                paidInFull: false 
              } as GroupContract} />
              <Text fontWeight="medium">{metrics.depositPaidCount} contracts</Text>
            </HStack>
            <Text fontWeight="bold" color="deposit">
              {formatCurrency(metrics.depositPaidRevenue)}
            </Text>
          </HStack>
          
                    
          <HStack justify="space-between">
            <HStack>
              <PaymentStatusBadge contract={{ 
                totalPaid: 5000, 
                depositPaid: true, 
                paidInFull: true 
              } as GroupContract} />
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
