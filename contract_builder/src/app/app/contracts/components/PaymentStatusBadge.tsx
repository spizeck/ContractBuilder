'use client'

import { Badge } from '@chakra-ui/react'
import { GroupContract, Payment } from '@/app/app/contracts/_types'
import { useState, useEffect, useMemo } from 'react'
import { getPayments } from '@/app/app/contracts/_lib/paymentsRepo'
import { roundToCents } from '@shared/utils/formatters'

interface PaymentStatusBadgeProps {
  contract: GroupContract
  payments?: Payment[]
  size?: 'sm' | 'md' | 'lg'
}

export default function PaymentStatusBadge({ contract, payments, size = 'md' }: PaymentStatusBadgeProps) {
  const [fetchedPayments, setFetchedPayments] = useState<Payment[] | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch payments if not provided and contract has valid ID
  useEffect(() => {
    if (!payments && !fetchedPayments && !loading && contract.id) {
      setLoading(true)
      getPayments(contract.id)
        .then(setFetchedPayments)
        .catch(error => {
          console.error('Error fetching payments:', error)
        })
        .finally(() => setLoading(false))
    }
  }, [contract.id, payments, fetchedPayments, loading])

  const paymentStatus = useMemo(() => {
    // Use provided payments or fetched payments, otherwise fall back to static flags
    const paymentData = payments || fetchedPayments
    
    if (paymentData) {
      const totalPaid = paymentData.reduce((sum, payment) => sum + payment.amount, 0)
      const remaining = roundToCents(contract.totalCost - totalPaid)

      if (remaining <= 0) {
        return { status: 'Paid in Full', colorScheme: 'green' }
      } else if (totalPaid > 0) {
        return { status: 'Deposit', colorScheme: 'yellow' }
      } else {
        return { status: 'Unpaid', colorScheme: 'red' }
      }
    }

    // Fallback to static flags for instant display
    if (contract.paidInFull) {
      return { status: 'Paid in Full', colorScheme: 'green' }
    }
    if (contract.depositPaid) {
      return { status: 'Deposit', colorScheme: 'yellow' }
    }
    return { status: 'Unpaid', colorScheme: 'red' }
  }, [contract.totalCost, contract.paidInFull, contract.depositPaid, payments, fetchedPayments])

  return (
    <Badge colorScheme={paymentStatus.colorScheme} size={size} variant="solid">
      {paymentStatus.status}
    </Badge>
  )
}
