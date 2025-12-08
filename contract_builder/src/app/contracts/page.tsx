'use client'

import { Suspense } from 'react'
import { VStack, Spinner } from '@chakra-ui/react'
import ContractPageContent from './components/ContractPageContent'

export default function ContractPage() {
  return (
    <Suspense fallback={
      <VStack spacing={4} p={5} justify="center" align="center" minH="200px">
        <Spinner size="lg" />
        <div>Loading contracts...</div>
      </VStack>
    }>
      <ContractPageContent />
    </Suspense>
  )
}
