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
  Divider,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { GroupContract } from '@/types/contractTypes'
import PaymentStatusBadge from './PaymentStatusBadge'

interface PaymentDashboardProps {
  contracts: GroupContract[]
  onFilterByStatus?: (status: string) => void
}

interface PaymentMetrics {
  totalRevenue: number
  // Summary card metrics
  totalSecuredContracts: number
  securedContractsCount: number
  securedContractsValue: number
  unsecuredContractsCount: number
  unsecuredContractsValue: number
  depositsAmount: number
  depositsCount: number
  paidInFullValue: number
  paidInFullCount: number
  // Revenue by Payment Status amounts (total contract values)
  unpaidRevenue: number
  depositPaidRevenue: number
  paidInFullRevenue: number
}

export default function PaymentDashboard({ contracts, onFilterByStatus }: PaymentDashboardProps) {

  const metrics = useMemo((): PaymentMetrics => {
    const initial: PaymentMetrics = {
      totalRevenue: 0,
      // Summary card metrics
      totalSecuredContracts: 0,
      securedContractsCount: 0,
      securedContractsValue: 0,
      unsecuredContractsCount: 0,
      unsecuredContractsValue: 0,
      depositsAmount: 0,
      depositsCount: 0,
      paidInFullValue: 0,
      paidInFullCount: 0,
      // Revenue by Payment Status amounts (total contract values)
      unpaidRevenue: 0,
      depositPaidRevenue: 0,
      paidInFullRevenue: 0
    }

    return contracts.reduce((acc, contract) => {
      const cost = contract.totalCost || 0
      const paid = contract.totalPaid || 0
      acc.totalRevenue += cost

      if (contract.paidInFull) {
        // Summary cards: fully paid contracts
        acc.paidInFullValue += cost
        acc.paidInFullCount++
        acc.totalSecuredContracts++
        // Revenue by Payment Status: total contract values
        acc.paidInFullRevenue += cost
      } else if (contract.depositPaid) {
        // Summary cards: secured contracts (have deposits, not fully paid)
        acc.securedContractsValue += cost
        acc.securedContractsCount++
        acc.totalSecuredContracts++
        acc.depositsAmount += paid
        acc.depositsCount++
        // Revenue by Payment Status: total contract values
        acc.depositPaidRevenue += cost
      } else {
        // Summary cards: unsecured contracts (no deposits)
        acc.unsecuredContractsValue += cost
        acc.unsecuredContractsCount++
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
      
      {/* Informational Alert */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text fontSize="sm">
          This dashboard shows <strong>upcoming contracts only</strong> and does not include past contracts.
        </Text>
      </Alert>
      
      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Total Secured Contracts</StatLabel>
            <StatNumber fontSize="3xl">{metrics.totalSecuredContracts}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.securedContractsValue + metrics.paidInFullValue)} secured value
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt" display="flex" flexDirection="column" justifyContent="space-between">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Unsecured Contracts</StatLabel>
            <StatNumber fontSize="3xl" color="unpaid">{metrics.unsecuredContractsCount}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.unsecuredContractsValue)} unsecured value
            </StatHelpText>
          </Stat>
          {onFilterByStatus && (
            <Button 
              size="sm" 
              colorScheme="red" 
              variant="outline" 
              onClick={() => onFilterByStatus('unpaid')}
            >
              View Unsecured
            </Button>
          )}
        </Box>

        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt" display="flex" flexDirection="column" justifyContent="space-between">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Contracts with Deposits</StatLabel>
            <StatNumber fontSize="3xl" color="deposit">{metrics.depositsCount}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.depositsAmount)} in deposits
            </StatHelpText>
          </Stat>
          {onFilterByStatus && (
            <Button 
              size="sm" 
              colorScheme="yellow" 
              variant="outline" 
              onClick={() => onFilterByStatus('deposit-paid')}
            >
              View Deposits
            </Button>
          )}
        </Box>

        <Box bg="cardBg" p={6} borderRadius="lg" borderWidth="1px" borderColor="borderAlt" display="flex" flexDirection="column" justifyContent="space-between">
          <Stat>
            <StatLabel fontSize="sm" color="textMuted">Paid in Full</StatLabel>
            <StatNumber fontSize="3xl" color="paid">{metrics.paidInFullCount}</StatNumber>
            <StatHelpText>
              {formatCurrency(metrics.paidInFullValue)} collected
            </StatHelpText>
          </Stat>
          {onFilterByStatus && (
            <Button 
              size="sm" 
              colorScheme="green" 
              variant="outline" 
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
              <Text fontWeight="medium">{metrics.unsecuredContractsCount} contracts</Text>
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
              <Text fontWeight="medium">{metrics.securedContractsCount} contracts</Text>
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
