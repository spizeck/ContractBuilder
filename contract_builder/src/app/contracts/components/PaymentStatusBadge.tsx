'use client'

import { Badge } from '@chakra-ui/react'
import { GroupContract } from '@/types/contractTypes'

interface PaymentStatusBadgeProps {
  contract: GroupContract
  size?: 'sm' | 'md' | 'lg'
}

export default function PaymentStatusBadge({ contract, size = 'md' }: PaymentStatusBadgeProps) {
  const getPaymentStatus = () => {
    if (contract.paidInFull) {
      return { status: 'Paid in Full', colorScheme: 'green' }
    }
    if (contract.depositPaid) {
      return { status: 'Deposit', colorScheme: 'yellow' }
    }
    return { status: 'Unpaid', colorScheme: 'red' }
  }

  const { status, colorScheme } = getPaymentStatus()

  return (
    <Badge colorScheme={colorScheme} size={size} variant="solid">
      {status}
    </Badge>
  )
}
